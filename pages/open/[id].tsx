import PlexTrack from '@/components/Playlists/PlexTrack';
import { GetTrackResponse } from '@/pages/api/tracks';
import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout from '@aiguestdj/shared/layouts/MainLayout';
import { GetPlaylistResponse } from "@aiguestdj/shared/types/AIGuestDJ";
import { Box, Button, Divider, Sheet, Stack, Typography } from '@mui/joy';
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from "react";
import { GetPlexPlaylistIdResponse } from '../api/playlists/[id]';

export type TrackSelection = {
    artist: string
    name: string
    index: number
}

const Page: NextPage = () => {

    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

    const [tracks, setTracks] = useState<GetTrackResponse[]>([]);
    const [trackSelections, setTrackSelections] = useState<TrackSelection[]>([])

    const [plexPlaylist, setPlexPlaylist] = useState<GetPlexPlaylistIdResponse>()
    const [playlist, setPlaylist] = useState<GetPlaylistResponse>()

    const router = useRouter();

    // Loader
    useEffect(() => {
        if (!router.isReady) return
        errorBoundary(async () => {
            const playlistResult = await axios.get<GetPlaylistResponse>(`${process.env.NEXT_PUBLIC_AIGUESTDJ_URL || "https://aiguestdj.com"}/api/playlists/${router.query.id}`)
            setPlaylist(playlistResult.data)
            setLoading(false)
        }, () => {
            setLoading(false)
        })
    }, [router.isReady])

    // Check for existing playlists
    useEffect(() => {
        if (!playlist) return;
        errorBoundary(async () => {
            const playlistResult = await axios.get<GetPlexPlaylistIdResponse>(`/api/playlists/${playlist.id}`)
            setPlexPlaylist(playlistResult.data)
        }, () => {
        }, true)
    }, [playlist])
    // Load tracks
    useEffect(() => {
        if (!playlist) return;

        if (tracks.length > 0) return;

        setLoadingTracks(true);
        const controller = new AbortController();
        errorBoundary(async () => {
            const tracks = playlist.tracks.map(item => ({ artist: item.artist, name: item.name, spotify_artist: item.spotify_artist ? item.spotify_artist.split(",")[0] : null, spotify_name: item.spotify_name }))
            const result = await axios.post<GetTrackResponse[]>('/api/tracks', {
                items: tracks
            }, { signal: controller.signal })
            setTracks(result.data);
            setTrackSelections(result.data.map(item => ({ artist: item.artist, name: item.name, index: 0 })))
            setLoadingTracks(false);
        }, () => {
            setLoadingTracks(false);
        }, true)
        return () => {
            controller.abort()
        }
    }, [playlist])

    const setTrackSelection = (artist: string, name: string, idx: number) => {
        setTrackSelections(items => items.map(item => {
            if (item.artist == artist && item.name == name)
                return { ...item, index: idx }
            return item;
        }))
    }
    const onPutPlaylistClick = () => {
        if (!playlist) return;

        const data: any = {
            id: playlist.id,
            name: playlist.name,
            items: []
        }
        for (let i = 0; i < tracks.length; i++) {
            const item = tracks[i];
            const trackSelectIdx = trackSelections.filter(selectionItem => selectionItem.artist == item.artist && selectionItem.name == item.name)[0]
            const song = item.Result[trackSelectIdx ? trackSelectIdx.index : 0];
            if (song)
                data.items.push({ key: song.key, source: song.source })
        }

        setSaving(true)
        errorBoundary(async () => {
            if (plexPlaylist) {
                await axios.put<GetPlexPlaylistIdResponse>(`/api/playlists/${playlist.id}`, data)
                enqueueSnackbar("Playlist updated")
            } else {
                const result = await axios.post<GetPlexPlaylistIdResponse>('/api/playlists', data)
                setPlexPlaylist(result.data);
                enqueueSnackbar("Playlist created")
            }
            setSaving(false)
        }, () => {
            setSaving(false)
        })

    }

    return (<>
        <Head>
            <title>AI Guest DJ | Designed for Plex</title>
        </Head>
        <MainLayout type='plex' loading={loading}>
            <Sheet sx={{ p: 1, md: { p: 3 }, mt: 5 }}>
                <Box maxWidth={650} margin={"0 auto"}>
                    {playlist && <Box mt={1}>
                        <Box textAlign={"center"}>
                            <Typography level="h2">{playlist.name}</Typography>
                            <Typography level="body-sm" fontStyle={"italic"}>{playlist.prompt}</Typography>
                        </Box>
                        <Divider sx={{ mt: 1, mb: 1 }} />
                        <Box display={'flex'} justifyContent={'center'} gap={1}>
                            <Button disabled={loadingTracks} loading={saving} onClick={onPutPlaylistClick}>{plexPlaylist ? "Update" : "Create"} playlist</Button>
                            <Button component="a" disabled={!plexPlaylist} href={plexPlaylist?.link} target='_blank'>Open playlist</Button>
                        </Box>
                        <Divider sx={{ mt: 1, mb: 1 }} />
                        <Stack>
                            {playlist.tracks.map(track => {
                                const data = tracks.filter(item => track.artist == item.artist && track.name == item.name)[0];
                                const trackSelectIdx = trackSelections.filter(item => item.artist == track.artist && item.name == track.name)[0]
                                const songIdx = trackSelectIdx ? trackSelectIdx.index : 0;
                                return <PlexTrack key={`roon-${track.name}`} loading={loadingTracks} track={track} setSongIdx={(idx) => setTrackSelection(data.artist, data.name, idx)} songIdx={songIdx} data={data} />
                            })}
                        </Stack>
                    </Box>}
                </Box>
            </Sheet>
        </MainLayout>
    </>)
}
export default Page;
