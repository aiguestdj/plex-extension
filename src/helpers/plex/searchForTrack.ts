import { findMatchingTracks } from "../findMatchingTracks";
import doDiscoverSearch from "./doDiscoverSearch";
import doHubSearch from "./doHubSearch";

export async function searchForTrack(artist: string, track: string) {
    let search = `${artist} ${track}`;

    // First attempt @ Plex Media Server
    {
        const searchResult = await doHubSearch(search);
        const result = findMatchingTracks(searchResult, artist, track);
        if (search.indexOf('Reminisce') > -1) {
            console.log(result)
        }
        if (result.length > 0)
            return result;
    }

    // Second attempt @ Plex Media Server - Looking for track only
    {
        let alternative = `${track}`;
        if (alternative.indexOf('Reminisce') > -1) {
            const searchResult = await doHubSearch(alternative);
            const result = findMatchingTracks(searchResult, artist, track);
            if (result.length > 0)
                return result;
        }
    }

    // Final attempt - Search on the plex search provider
    {
        const searchResult = await doDiscoverSearch(search);
        // console.log("searchResult:", searchResult)
        const result = findMatchingTracks(searchResult, artist, track);
        if (result.length > 0)
            return result;
    }
    return []
}
