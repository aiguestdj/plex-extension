import { findMatchingTracks } from "../findMatchingTracks";
import doDiscoverSearch from "./doDiscoverSearch";
import doHubSearch from "./doHubSearch";



export async function searchForTrackInHubs(artist: string, track: string) {
    let search = `${artist} ${track}`;

    const searchResult = await doHubSearch(search, 5);
    const result = findMatchingTracks(searchResult, artist, track);

    let alternative = `${track}`;
    const alternativeSearchResult = await doHubSearch(alternative, 5);
    const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track);
    alternativeResult.forEach(item => {
        if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
            result.push(item)
    })
    return result;
}

export async function searchForTrackInDiscovery(artist: string, track: string) {
    let search = `${artist} ${track}`;

    const searchResult = await doDiscoverSearch(search);
    const result = findMatchingTracks(searchResult, artist, track);

    let alternative = `${track}`;
    const alternativeSearchResult = await doDiscoverSearch(alternative);
    const alternativeResult = findMatchingTracks(alternativeSearchResult, artist, track);
    alternativeResult.forEach(item => {
        if (result.filter(existingItem => existingItem.guid == item.guid).length == 0)
            result.push(item)
    })
    return result;
}
