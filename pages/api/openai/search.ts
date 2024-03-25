import { generateError } from '@aiguestdj/shared/helpers/generateError';
import { getOpenAISystemMessage } from '@aiguestdj/shared/helpers/openai/getOpenAISystemMessage';
import { getOpenAITools } from '@aiguestdj/shared/helpers/openai/getOpenAITools';
import { processCreatedPlaylists } from '@aiguestdj/shared/helpers/openai/processCreatedPlaylists';
import { storeUsage } from '@aiguestdj/shared/helpers/openai/storeUsage';
import { OpenAISearchResponse } from '@aiguestdj/shared/types/PostOpenAISearchResponse';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import OpenAI from 'openai';



const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {

            if (!req.body.search || (req.body.search && req.body.search.length < 8))
                return res.status(400).json({ message: "The search query seems to short to create a good playlist." })

            if (!process.env.OPENAI_KEY || process.env.OPENAI_KEY.toLowerCase().indexOf('openai') > -1)
                res.status(400).json({ message: "OpenAI not configured" })
            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
                const chatCompletion = await openai.chat.completions.create({
                    messages: [
                        { role: 'system', content: getOpenAISystemMessage() },
                        { role: 'user', content: req.body.search }
                    ],
                    tools: getOpenAITools(),
                    tool_choice: "auto",
                    model: req.body.gpt4 ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo-1106'
                });
                try {

                    // Store usage data
                    let usage = chatCompletion.usage?.total_tokens;
                    storeUsage(req.body.search, usage)

                    // Handle OpenAI completion
                    if (chatCompletion.choices[0] && chatCompletion.choices[0].message && chatCompletion.choices[0].message) {
                        const createdPlaylists: OpenAISearchResponse[] = []
                        let possibleError = chatCompletion.choices[0].message.content;
                        if (chatCompletion.choices[0].message.tool_calls) {
                            chatCompletion.choices[0].message.tool_calls.forEach(data => {
                                if (data.function.name == "StorePlaylist") {
                                    try {
                                        const playlistData = JSON.parse(data.function.arguments);
                                        if (playlistData.Name && playlistData.Genre && playlistData.Items && Array.isArray(playlistData.Items) && playlistData.Items.length > 0) {
                                            createdPlaylists.push(playlistData);
                                        } else {
                                            if (!possibleError)
                                                possibleError = playlistData.Reason;
                                        }
                                    } catch (e: any) {
                                        if (!possibleError)
                                            possibleError = e.message
                                    }
                                }
                            })
                        }
                        const playlist = processCreatedPlaylists(createdPlaylists)
                        if (playlist)
                            return res.status(200).json({ ...playlist, Prompt: req.body.search })

                        return res.status(400).json({ message: possibleError || "Could not create a playlist based on your prompt" });
                    } else {
                        return res.status(400).json({ message: "No message was returned by Open API", error_stack: JSON.stringify(chatCompletion.choices) });
                    }

                } catch (e: any) {
                    res.status(400).json({ message: e.message || "Something went wrong creating the playlist", error_stack: chatCompletion.choices[0].message.content || e.stack });
                }
            } catch (e: any) {
                if (typeof e == 'string') {
                    return res.status(400).json({ message: `${e}` })
                } else if (typeof e.message == 'string') {
                    return res.status(400).json({ message: `${e.message}`, error_stack: e.stack })
                }
            }
        })

export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "GPT Prompt", err);
    },
});


