import { plex } from '@/library/plex';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetPlexPlaylistIdResponse = {
    id: string,
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {

            const id = `${req.query.id}`
            const playlists = plex.playlists.data || [];
            const playlist = playlists.filter(item => item.id == id)[0];
            if (!playlist)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

            res.json({ id: playlist.plex })
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


