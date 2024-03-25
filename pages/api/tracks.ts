import { GetMatchingTrackResponse } from '@/helpers/findMatchingTracks';
import { searchForTrack } from '@/helpers/plex/searchForTrack';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetTrackResponse = {
    artist: string
    name: string
    Result: GetMatchingTrackResponse[]
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {
            const items: { artist: string, name: string }[] = req.body.items;
            if (!items || items.length == 0)
                return res.status(400).json({ msg: "No items given" });

            const promises: Promise<GetTrackResponse>[] = []
            for (let i = 0; i < items.length && !res.destroyed; i++) {
                const { artist, name } = items[i];
                const promise = new Promise<GetTrackResponse>(async (resolve, reject) => {
                    try {
                        const searchResult = await searchForTrack(artist, name)
                        resolve({
                            artist: artist,
                            name: name,
                            Result: searchResult
                        })
                    } catch (e) {
                        reject("Something went wrong while searching")
                    }
                })
                promises.push(promise)
            }


            //@ts-ignore
            const result: GetTrackResponse[] = (await Promise.allSettled(promises)).filter(item => item.status == "fulfilled").map(item => item.value)
            res.status(200).json(result);
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});

