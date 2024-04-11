import PlexPlaylist from "@/components/Playlists/PlexPlaylist";
import { GetSpotifyAlbum, GetSpotifyPlaylist } from "@aiguestdj/shared";
import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout from "@aiguestdj/shared/layouts/MainLayout";
import { KeyboardArrowRightSharp } from "@mui/icons-material";
import { Box, Button, Input, Sheet, Typography } from "@mui/joy";
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";

const Page: NextPage = () => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [spotifyInput, setSpotifyInput] = useState<string>('')
    const [playlist, setPlaylist] = useState<GetSpotifyAlbum | GetSpotifyPlaylist>()
    const onGenerateClick = () => {
        errorBoundary(async () => {
            setGenerating(true);

            const result = await axios.post<GetSpotifyAlbum | GetSpotifyPlaylist>(`${process.env.NEXT_PUBLIC_AIGUESTDJ_URL || "https://aiguestdj.com"}/api/import/spotify`, {
                search: spotifyInput
            })
            setPlaylist(result.data)
            setGenerating(false);

        }, () => {
            setGenerating(false);
        })
    }
    const sendDisabled = String(spotifyInput).length < 8;
    return (<>
        <Head>
            <title>AI Guest DJ | Designed for Music Lovers</title>
        </Head>
        <MainLayout type="plex">
            <Sheet sx={{ minHeight: "calc(100vh - 120px)" }}>
                <Sheet sx={{ position: "relative", p: 1, pt: 5, pb: 18 }} variant="soft" color="primary">
                    <Box sx={{ position: "absolute", pointerEvents: "none", bottom: "-150px", left: 0, width: "100%", overflow: "hidden", height: 480 }}>
                        <Box sx={{ position: "absolute", width: "4000px", left: "50%", height: "100%", marginLeft: "-2000px", bottom: 170, "& svg path": { fill: "var(--joy-palette-neutral-900, #0B0D0E)" } }}>
                            <div dangerouslySetInnerHTML={{
                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,192L80,176C160,160,320,128,480,133.3C640,139,800,181,960,181.3C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>`
                            }}></div>
                        </Box>
                    </Box>
                    <Box maxWidth={600} p={2} margin={"0 auto"}>
                        <Typography level="h1" mb={.5}>Import playlist</Typography>
                        <Typography mb={1} level="body-md">Instead of generating your playlists using Open AI you can also import existing playlists. It currently supports the following input:</Typography>
                        <Typography level="body-md" mt={1} mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URL &#40;e.g. https://open.spotify.com/playlist/37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                        <Typography level="body-md" mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URI &#40;e.g. spotify:playlist:37i9dQZF1EQqA6klNdJvwx &#41;</Typography>
                        <Box mt={2}>
                            <Typography level="body-sm" >Note: Automated Spotify playlists differs per user and per country.</Typography>
                        </Box>

                        <Box mt={2}>
                            <Input placeholder="Enter your Spotify URL/URI here.." disabled={generating} value={spotifyInput} onChange={(e) => setSpotifyInput(e.currentTarget.value)} />
                            <Box mt={1} textAlign={'right'}>
                                <Button loading={generating} size="sm" disabled={!!sendDisabled} onClick={onGenerateClick}>Import playlist</Button>
                            </Box>
                        </Box>
                    </Box>
                </Sheet>
                <Sheet>
                    <Box maxWidth={600} p={3} margin={"0 auto"}>
                        {playlist && <PlexPlaylist playlist={playlist} />}
                    </Box>
                </Sheet>
            </Sheet>
        </MainLayout >

    </>
    )
}

export default Page;
