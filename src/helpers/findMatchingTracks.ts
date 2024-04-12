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
        title: { match: boolean, contains: boolean, similarity: number },
        artist: { match: boolean, contains: boolean, similarity: number },
        artistInTitle: { match: boolean, contains: boolean, similarity: number },
        artistWithTitle: { match: boolean, contains: boolean, similarity: number },
    }
}

export function findMatchingTracks(items: (GetHubSearchResponse | GetDiscoverySearchResponse)[], artist: string, track: string): GetMatchingTrackResponse[] {
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
                    title: compareTitles(item.title, track, true),
                    artistInTitle: compareTitles(item.title, `${artist}`),
                    artistWithTitle: compareTitles(item.title, `${artist} ${track}`, true),
                    artist: compareTitles(item.artist.title, artist, true),
                }
            };
            return result;
        })

    return foundTracks
}