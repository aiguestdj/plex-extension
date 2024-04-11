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
export type PostTrackData = {
    artist: string,
    name: string,
    spotify_artist: string | null,
    spotify_name: string | null,
    idx: number
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {
            const items: PostTrackData[] = req.body.items;
            if (!items || items.length == 0)
                return res.status(400).json({ msg: "No items given" });

            let promises: Promise<GetTrackResponse>[] = []
            let result: PromiseSettledResult<Awaited<GetTrackResponse>>[] = []
            let request_cap = 15;
            
            for (let i = 0; i < items.length && !res.destroyed; i++) {
                const { artist, name, spotify_artist, spotify_name } = items[i];
                const promise = new Promise<GetTrackResponse>(async (resolve, reject) => {
                    try {
                        let searchResult = await searchForTrack(artist, name)
                        if (searchResult.length == 0 && spotify_artist && spotify_name)
                            searchResult = await searchForTrack(spotify_artist, spotify_name)

                        resolve({
                            artist: artist,
                            name: name,
                            Result: searchResult
                        })
                    } catch (e) {
                        reject("Something went wrong while searching")
                    }
                })

                // Batch play
                promises.push(promise)
                if (promises.length == request_cap) {
                    result = result.concat(await Promise.allSettled(promises));
                    promises = [];
                }
            }

             //@ts-ignore
             if (promises.length > 0)
                result = result.concat(await Promise.allSettled(promises));

            // const result = (await Promise.allSettled(promises)).filter(item => item.status == "fulfilled").map(item => item.value)
            res.status(200).json(result.filter(item => item.status == "fulfilled").map(item => item.status == "fulfilled" ? item.value : null));
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


