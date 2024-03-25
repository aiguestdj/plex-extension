import { generateError } from '@aiguestdj/shared/helpers/generateError';
import { OpenAISettings, settings } from '@aiguestdj/shared/library/settings';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import OpenAI from 'openai';


export type GetOpenAIProfileResponse = OpenAISettings;

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {

            if (!process.env.OPENAI_KEY || process.env.OPENAI_KEY.toLowerCase().indexOf('openai') > -1)
                res.status(400).json({ message: "OpenAI not configured" })

            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
                await openai.models.list();
                res.status(200).json(settings.data);
            } catch (e) {
                res.status(400).json({ message: "Failed connecting with OpenAI API" })
            }
        })

    .post(
        async (req, res, next) => {

            if (!req.body.gptConfig || typeof req.body.gptConfig != "string")
                res.status(400).json({ message: "Configuration is required" })

            settings.saveConfig({ requests: settings.data.requests, gptConfig: req.body.gptConfig })
            res.status(200).json(settings.data)
        }
    )

export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        console.log("err:", err)
        generateError(req, res, "Open AI Connection", err);
    },
});


