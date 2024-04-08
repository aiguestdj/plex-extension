import { findMatchingTracks } from "../findMatchingTracks";
import doDiscoverSearch from "./doDiscoverSearch";
import doHubSearch from "./doHubSearch";

export async function searchForTrack(artist: string, track: string) {
    let search = `${artist} ${track}`;

    const debug = false;
    // First attempt @ Plex Media Server
    {
        const searchResult = await doHubSearch(search, 5, debug);
        const result = findMatchingTracks(searchResult, artist, track);
        if (result.length > 0)
            return result;
    }

    // Second attempt @ Plex Media Server - Looking for track only
    {
        let alternative = `${track}`;
        const searchResult = await doHubSearch(alternative, 5, debug);
        const result = findMatchingTracks(searchResult, artist, track);
        if (result.length > 0)
            return result;
    }

    // Almost final attempt - Search on the plex search provider
    {
        const searchResult = await doDiscoverSearch(search);
        const result = findMatchingTracks(searchResult, artist, track);
        if (result.length > 0)
            return result;
    }
    // Final attempt - Search on the plex search provider
    {
        let alternative = `${track}`;
        const searchResult = await doDiscoverSearch(alternative);
        const result = findMatchingTracks(searchResult, artist, track);
        if (result.length > 0)
            return result;
    }

    return []
}
