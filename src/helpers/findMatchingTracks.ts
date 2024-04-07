import { compareTitles } from '@aiguestdj/shared/helpers/compareTitles';
import { GetDiscoverySearchResponse } from './plex/doDiscoverSearch';
import { GetHubSearchResponse } from './plex/doHubSearch';

export type GetMatchingTrackResponse = {
    guid: string;
    key: string;
    source?: string;
    artist: {
        title: string;
        guid?: string;
        key?: string;
        image?: string;
    };
    album?: {
        title: string;
        key?: string;
        guid?: string;
        image?: string;
    };
    title: string;
    image: string;
    matching: {
        title: { match: boolean, contains: boolean },
        artist: { match: boolean, contains: boolean },
    }
}

export function findMatchingTracks(items: (GetHubSearchResponse | GetDiscoverySearchResponse)[], artist: string, track: string, debug: boolean = false): GetMatchingTrackResponse[] {
    const foundTracks = items
        .filter(item => item.type == "track")
        .map(item => {
            const result = {
                guid: item.guid,
                key: item.key,
                artist: item.artist,
                album: item.type == 'track' ? item.album : undefined,
                title: item.title,
                image: item.image,
                source: item.source,
                matching: {
                    title: compareTitles(item.title, track),
                    artist: compareTitles(item.artist.title, artist),
                }
            };
            if (debug)
                console.log(track, result)
            return result;
        })
        .filter(item => (item.matching.artist.match || item.matching.artist.contains) &&
            (item.matching.title.match || item.matching.title.contains)
        )
        .sort((a, b) => {
            let aMatches = (a.matching.title.match ? 1 : 0) + (a.matching.artist.match ? 1 : 0);
            let bMatches = (b.matching.title.match ? 1 : 0) + (b.matching.artist.match ? 1 : 0);
            return aMatches - bMatches;
        });

    // Return only pure tracks
    if (foundTracks.filter(item => item.matching.artist.match && item.matching.title.match).length > 0)
        return foundTracks.filter(item => item.matching.artist.match && item.matching.title.match);

    return foundTracks
}