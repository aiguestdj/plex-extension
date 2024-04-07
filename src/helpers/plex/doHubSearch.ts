import { plex } from "@/library/plex"
import { HubSearchResponse, Metadata } from "@/types/PlexAPI"
import axios from "axios"
import getPlexAPIUrl from "../getPlexAPIUrl"

export type GetHubSearchResponse = (GetHubSearchAlbumResponse | GetHubSearchTrackResponse)
export type GetHubSearchTrackResponse = {
    type: "track",
    key: Metadata["key"],
    guid: Metadata["guid"],
    score: Metadata["score"],
    image: Metadata["thumb"],
    title: Metadata["title"],
    source?: string,
    album: {
        guid: Metadata["parentGuid"],
        key: Metadata["parentKey"],
        title: Metadata["parentTitle"],
        year: Metadata["parentYear"],
        image: Metadata["parentThumb"],
    },
    artist: {
        guid: Metadata["grandparentGuid"],
        key: Metadata["grandparentKey"],
        title: Metadata["grandparentTitle"],
        image: Metadata["grandparentThumb"],
    }
}

export type GetHubSearchAlbumResponse = {
    type: "album",
    key: Metadata["key"],
    guid: Metadata["guid"],
    score: Metadata["score"],
    image: Metadata["thumb"],
    year: Metadata["year"],
    title: Metadata["title"],
    source?: string,
    artist: {
        guid: Metadata["parentGuid"],
        key: Metadata["parentKey"],
        title: Metadata["parentTitle"],
        image: Metadata["parentThumb"],
    },
}


export default function doHubSearch(query: string, limit: number = 5, debug: boolean = false) {
    return new Promise<GetHubSearchResponse[]>((resolve, reject) => {
        if (!plex.settings.uri || !plex.settings.token) {
            reject("No Plex connection found");
            return;
        }

        const url = getPlexAPIUrl(plex.settings.uri, `/hubs/search?query=${encodeURIComponent(query)}&limit=${limit}`, plex.settings.token);
        axios.get<HubSearchResponse>(url)
            .then((result) => {
                const response: GetHubSearchResponse[] = [];
                if (result.data.MediaContainer.Hub.length > 0) {
                    for (let i = 0; i < result.data.MediaContainer.Hub.length; i++) {
                        const hub = result.data.MediaContainer.Hub[i];
                        if (hub.type == "album" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                response.push({
                                    type: "album",
                                    key: metadata.key,
                                    guid: metadata.guid,
                                    score: metadata.score,
                                    image: metadata.thumb,
                                    year: metadata.year,
                                    title: metadata.title,
                                    artist: {
                                        guid: metadata.parentGuid,
                                        key: metadata.parentKey,
                                        title: metadata.parentTitle,
                                        image: metadata.parentThumb,
                                    },
                                })
                            }
                        }
                        if (hub.type == "track" && hub.Metadata) {
                            for (let j = 0; j < hub.Metadata.length; j++) {
                                const metadata = hub.Metadata[j];
                                if (debug)
                                    console.log(metadata)
                                response.push({
                                    type: "track",
                                    key: metadata.key,
                                    guid: metadata.guid,
                                    score: metadata.score,
                                    image: metadata.thumb,
                                    title: metadata.title,
                                    album: {
                                        guid: metadata.parentGuid,
                                        key: metadata.parentKey,
                                        title: metadata.parentTitle,
                                        year: metadata.parentYear,
                                        image: metadata.parentThumb,
                                    },
                                    artist: {
                                        guid: metadata.grandparentGuid,
                                        key: metadata.grandparentKey,
                                        title: metadata.originalTitle || metadata.grandparentTitle,
                                        image: metadata.grandparentThumb,
                                    }
                                })
                            }
                        }
                    }
                }
                resolve(response)
            }).catch((error) => {
                reject("Could not connect to server");
            })

    })
}