import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import axios from 'axios';

export async function removeItemsFromPlaylist(id: string) {
    if (!plex.settings.uri || !plex.settings.token)
        throw new Error('No Plex connection found');

    const url = getAPIUrl(plex.settings.uri, `/playlists/${id}/items`);
    await axios.delete(url, {
        headers: {
            'Accept': 'application/json',
            'X-Plex-Token': plex.settings.token
        }
    });

}
