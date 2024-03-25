import getPlexAPIUrl from '@/helpers/getPlexAPIUrl';
import { plex } from '@/library/plex';
import { GetPlaylistResponse, Playlist } from '@/types/PlexAPI';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetPlexPlaylistResponse = {
    key: Playlist["key"],
    guid: Playlist["guid"],
    title: Playlist["title"],
}


const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {


            if (!plex.settings.uri || !plex.settings.token) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            const url = getPlexAPIUrl(plex.settings.uri, `/playlists`, plex.settings.token);
            const plexData = (await axios.get<GetPlaylistResponse>(url)).data;
            const result: GetPlexPlaylistResponse[] = []
            plexData.MediaContainer.Metadata.forEach((item) => {
                if (!item.smart && item.playlistType == 'audio') {
                    result.push({
                        key: item.key,
                        guid: item.guid,
                        title: item.title,
                    })
                }
            })
            res.json(result);
        })
    .post(
        async (req, res, next) => {
            const items: string[] = req.body.items;
            if (!items || items.length == 0)
                return res.status(400).json({ msg: "No items given" });

            const playlistName: string = req.body.playlistName;
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Plex Playlists", err);
    }
});


