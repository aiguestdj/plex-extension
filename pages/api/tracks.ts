import { GetMatchingTrackResponse } from '@/helpers/findMatchingTracks';
import { searchForTrackInDiscovery, searchForTrackInHubs } from '@/helpers/plex/searchForTrack';
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

function getPerfectMatches(results: GetMatchingTrackResponse[]) {

    // Check for perfect matches
    const perfectMatches = results.filter(item => item.matching.artist.match && item.matching.title.match)
    if (perfectMatches.length > 0)
        return perfectMatches;

    const almostPerfectMatches = results.filter(item => item.matching.artist.match && item.matching.title.contains)
    if (almostPerfectMatches.length > 0)
        return almostPerfectMatches;

    const verySimilarMatches = results.filter(item => item.matching.artist.similarity >= 0.9 && item.matching.title.similarity >= 0.9)
    if (verySimilarMatches.length > 0)
        return verySimilarMatches;

    const verySimilarArtistWithTitleMatches = results.filter(item => item.matching.artistWithTitle.similarity >= 0.95)
    if (verySimilarArtistWithTitleMatches.length > 0)
        return verySimilarArtistWithTitleMatches;

    return []
}
function getPerfectTitles(results: GetMatchingTrackResponse[]) {
    const perfectTitleMatches = results.filter(item => item.matching.title.similarity == 1 && (item.matching.artist.similarity >= 0.9 || (item.matching.artistWithTitle.similarity >= 0.9 || item.matching.artistWithTitle.contains)))
    if (perfectTitleMatches.length > 0)
        return perfectTitleMatches;

    const verySimilarMatches = results.filter(item => item.matching.title.similarity >= 0.8 && (item.matching.artist.similarity >= 0.8 || (item.matching.artistWithTitle.similarity >= 0.8 || item.matching.artistWithTitle.contains || item.matching.artistInTitle.contains)))
    if (verySimilarMatches.length > 0)
        return verySimilarMatches;

    const littleBitSimilarMatches = results.filter(item => item.matching.title.contains && (item.matching.artist.contains || item.matching.artistInTitle.contains));
    if (littleBitSimilarMatches.length > 0)
        return littleBitSimilarMatches;

    // const verLittleBitSimilarMatches = results.filter(item => item.matching.title.similarity > 0 && (item.matching.artist.similarity > 0.7 || item.matching.artist.contains || item.matching.artistInTitle.contains));
    // if (verLittleBitSimilarMatches.length > 0)
    //     return verLittleBitSimilarMatches;

    return []
}
function filterOutWordsFromSearch(input: string, cutOffSeperators: boolean = false) {
    let words = [" original ", " mix "];
    let result = input.toLowerCase();
    for (let i = 0; i < words.length; i++) {
        result = result.split(words[i]).join("")
    }
    if (cutOffSeperators && result.indexOf('(') > -1)
        result = result.substring(0, result.indexOf('('))
    if (cutOffSeperators && result.indexOf('-') > -1)
        result = result.substring(0, result.indexOf('-'))

    return result;
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
                const { artist, name: searchName, spotify_artist, spotify_name } = items[i];
                const promise = new Promise<GetTrackResponse>(async (resolve, reject) => {
                    try {
                        // Data storage
                        let localResult, localSpotifyResult, discoveryResult, discoverySpotifyResult;
                        let searchResult: GetMatchingTrackResponse[] = []

                        const searchApproaches: { platform: string, trimmed: boolean, data: GetMatchingTrackResponse[] | null }[] = [
                            { platform: 'local', trimmed: false, data: null },
                            { platform: 'local_spotify', trimmed: false, data: null },
                            { platform: 'discovery', trimmed: false, data: null },
                            { platform: 'discovery_spotify', trimmed: false, data: null },
                            { platform: 'local', trimmed: true, data: null },
                            { platform: 'local_spotify', trimmed: true, data: null },
                            { platform: 'discovery', trimmed: true, data: null },
                            { platform: 'discovery_spotify', trimmed: true, data: null },
                        ]

                        let searchApproachIndex = 0;
                        while (searchResult.length == 0 && searchApproaches[searchApproachIndex]) {

                            const approach = searchApproaches[searchApproachIndex]
                            const { platform, trimmed } = approach
                            const name = filterOutWordsFromSearch(searchName, trimmed)
                            const spotifyName = filterOutWordsFromSearch(spotify_name || "", trimmed)

                            switch (platform) {
                                case "local":
                                case "local_trimmed":
                                    localResult = await searchForTrackInHubs(artist, name)
                                    approach.data = localResult;
                                    searchResult = getPerfectMatches(localResult);
                                    break;
                                case "local_spotify":
                                case "local_spotify_trimmed":
                                    if (spotifyName && spotify_artist) {
                                        localSpotifyResult = await searchForTrackInHubs(spotify_artist, spotifyName)
                                        approach.data = localSpotifyResult;
                                        searchResult = getPerfectMatches(localSpotifyResult);
                                    }
                                    break;
                                case "discovery":
                                case "discovery_trimmed":
                                    discoveryResult = await searchForTrackInDiscovery(artist, name)
                                    approach.data = discoveryResult
                                    searchResult = getPerfectMatches(discoveryResult);
                                    break;
                                case "discovery_spotify":
                                case "discovery_spotify_trimmed":
                                    if (spotifyName && spotify_artist) {
                                        discoverySpotifyResult = await searchForTrackInDiscovery(spotify_artist, spotifyName)
                                        approach.data = discoverySpotifyResult
                                        searchResult = getPerfectMatches(discoverySpotifyResult);
                                    }
                                    break;
                            }
                            searchApproachIndex++;
                        }

                        for (let i = 0; i < searchApproaches.length && searchResult.length == 0; i++) {
                            const { data } = searchApproaches[i];
                            if (data)
                                searchResult = getPerfectTitles(data)
                        }

                        // For debugging:
                        // if (searchResult.length == 0) {
                        //     for (let i = 0; i < searchApproaches.length; i++) {
                        //         const { data } = searchApproaches[i];
                        //         if (data) {
                        //             console.log(`${artist} - ${searchName}`)
                        //             console.log(data.map(item => ({
                        //                 x: `${item.artist.title} - ${item.title}`,
                        //                 artist: item.matching.artist,
                        //                 artistInTitle: item.matching.artistInTitle,
                        //                 artistWithTitle: item.matching.artistWithTitle,
                        //                 title: item.matching.title,
                        //             })))
                        //         }
                        //     }
                        // }

                        // Sort on similarity
                        searchResult.sort((a, b) => {
                            let aMatches = a.matching.artist.similarity + a.matching.title.similarity;
                            let bMatches = b.matching.artist.similarity + b.matching.title.similarity;
                            return bMatches - aMatches;
                        });

                        resolve({
                            artist: artist,
                            name: searchName,
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


