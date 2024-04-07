import getAPIUrl from '@/helpers/getAPIUrl';
import getPlexAPIUrl from '@/helpers/getPlexAPIUrl';
import { addItemsToPlaylist } from '@/helpers/plex/addItemsToPlaylist';
import { removeItemsFromPlaylist } from '@/helpers/plex/removeItemsFromPlaylist';
import { plex } from '@/library/plex';
import { GetPlaylistResponse } from '@/types/PlexAPI';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetPlexPlaylistIdResponse = {
    id: string,
    link: string
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {
            if (!plex.settings.uri || !plex.settings.token) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            const id = `${req.query.id}`
            const playlists = plex.playlists.data || [];
            const playlistIds = playlists.filter(item => item.id == id)[0];
            if (!playlistIds)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

            // Check the existence
            const url = getPlexAPIUrl(plex.settings.uri, `/playlists`, plex.settings.token);
            const result = await axios.get<GetPlaylistResponse>(url);
            const playlist = result.data.MediaContainer.Metadata.filter(item => item.ratingKey == playlistIds.plex)[0];
            if (!playlist)
                return res.status(404).json({ error: `Playlist not found with id ${playlistIds.plex}` })

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
            res.json({ id: playlistIds.plex, link: link })
        })
    .put(
        async (req, res, next) => {
            const name: string = req.body.name;
            const id: string = req.body.id;
            const items: { key: string, source?: string }[] = req.body.items;
            if (!items || items.length == 0 || !name || !id)
                return res.status(400).json({ msg: "Invalid data given" });

            if (!plex.settings.uri || !plex.settings.token || !plex.settings.id) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            const playlists = plex.playlists.data || [];
            const playlistIds = playlists.filter(item => item.id == id)[0];
            if (!playlistIds)
                return res.status(404).json({ error: `Playlist not found connected to ${id}` })

            // Check the existence
            const url = getPlexAPIUrl(plex.settings.uri, `/playlists`, plex.settings.token);
            const result = await axios.get<GetPlaylistResponse>(url);
            const playlist = result.data.MediaContainer.Metadata.filter(item => item.ratingKey == playlistIds.plex)[0];
            if (!playlist)
                return res.status(404).json({ error: `Playlist not found with id ${playlistIds.plex}` })

            // Clear items from playlist
            await removeItemsFromPlaylist(playlist.ratingKey);
            
            // Add all items
            await addItemsToPlaylist(playlist.ratingKey, items)

            const link = getAPIUrl(plex.settings.uri, `/web/index.html#!/server/${plex.settings.id}/playlist?key=${encodeURIComponent(`/playlists/${playlist.ratingKey}`)}`)
            res.json({ id: playlist.ratingKey, link: link })

        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        generateError(req, res, "Songs", err);
    }
});


