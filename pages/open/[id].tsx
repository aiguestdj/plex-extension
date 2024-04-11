import PlexPlaylist from '@/components/Playlists/PlexPlaylist';
import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout from '@aiguestdj/shared/layouts/MainLayout';
import { GetPlaylistResponse } from "@aiguestdj/shared/types/AIGuestDJ";
import { Box, Sheet } from '@mui/joy';
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export type TrackSelection = {
    artist: string
    name: string
    index: number
}

const Page: NextPage = () => {

    const [loading, setLoading] = useState<boolean>(true);
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

    return (<>
        <Head>
            <title>AI Guest DJ | Designed for Plex</title>
        </Head>
        <MainLayout type='plex' loading={loading}>
            <Sheet sx={{ p: 1, md: { p: 3 }, mt: 5 }}>
                <Box maxWidth={650} margin={"0 auto"}>
                    {playlist && <PlexPlaylist playlist={playlist} />}
                </Box>
            </Sheet>
        </MainLayout>
    </>)
}
export default Page;
