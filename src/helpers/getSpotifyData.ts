import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@aiguestdj/shared";
import { PlaylistedTrack, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";

export default async function getSpotifyData(id: string): Promise<GetSpotifyAlbum | GetSpotifyPlaylist | void> {
    const api = SpotifyApi.withClientCredentials(`${process.env.SPOTIFY_API_CLIENT_ID}`, `${process.env.SPOTIFY_API_CLIENT_SECRET}`);
    if (id.indexOf('spotify:album:') > -1) {
        const albumId = id.substring(id.indexOf('spotify:album:') + 'spotify:album:'.length).trim();
        try {
            const result = await api.albums.get(albumId)
            return {
                type: "spotify-album",
                id: result.id,
                name: result.name,
                artists: result.artists.map(item => item.name),
                image: result.images[0].url,
                tracks: result.tracks.items.map(item => ({
                    artist: item.artists[0].name,
                    id: item.id,
                    name: item.name
                }))
            }
        } catch (e) { }
    } else if (id.indexOf('spotify:playlist:') > -1) {
        const playlistId = id.substring(id.indexOf('spotify:playlist:') + 'spotify:playlist:'.length).trim();
        try {
            let allTracks: PlaylistedTrack<Track>[] = []
            let result = await api.playlists.getPlaylist(playlistId)
            allTracks = allTracks.concat(result.tracks.items);

            let offset = 100;
            let hasMoreResults = result.tracks.offset + result.tracks.limit < result.tracks.total;
            let nextUrl = result.tracks.next
            while (hasMoreResults && nextUrl) {
                let loadMore = await api.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, offset)
                allTracks = allTracks.concat(loadMore.items);
                hasMoreResults = loadMore.offset + loadMore.limit < loadMore.total;
                offset = loadMore.offset + loadMore.limit;

                // Wait one second
                await (new Promise(resolve => setTimeout(resolve, 1000)))
            }
            return {
                type: "spotify-playlist",
                id: result.id,
                name: result.name,
                image: result.images[0].url,
                tracks: allTracks.map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    artist: item.track.artists[0].name,
                    artists: item.track.artists.map(item => item.name),
                }))
            }
        } catch (e) {
            console.log(e)
        }
    }
}