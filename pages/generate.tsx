import OpenAISettingsDialog from "@aiguestdj/shared/components/OpenAISettingsDialog";
import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout, { User } from "@aiguestdj/shared/layouts/MainLayout";
import { OpenAISearchResponse } from "@aiguestdj/shared/types/PostOpenAISearchResponse";
import { EditOutlined, KeyboardArrowRightSharp } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Alert, Box, Button, IconButton, Input, Sheet, Switch, Typography } from "@mui/joy";
import axios from "axios";
import fetchJsonp from "fetch-jsonp";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GetOpenAIProfileResponse } from './api/openai/profile';

const Page: NextPage = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [prompt, setPrompt] = useState<string>('')
    const [gpt4, setGPT4] = useState<boolean>(false);

    const [generating, setGenerating] = useState<boolean>(false);
    const router = useRouter();

    const [user, setUser] = useState<User>();
    const [error, setError] = useState<boolean>(false);
    const [profile, setProfile] = useState<GetOpenAIProfileResponse>();
    const [showConfig, setShowConfig] = useState<boolean>(false)

    // Open AI
    useEffect(() => {
        if (!router.isReady) return
        errorBoundary(async () => {
            const openAIProfile = await axios.get(`/api/openai/profile`)
            setProfile(openAIProfile.data)
            setLoading(false)
        }, () => {
            setError(true)
            setLoading(false)
        }, true)
    }, [router.isReady])

    // Open AI
    useEffect(() => {
        if (!router.isReady) return
        errorBoundary(async () => {
            const response = await fetchJsonp(`${process.env.NEXT_PUBLIC_AIGUESTDJ_URL || "https://aiguestdj.com"}/api/user?cb=cb`, { jsonpCallbackFunction: 'cb' })
            const result = await response.json<User>();
            if (result.id) {
                const user: User = { id: result.id }
                if (result.plex)
                    user.plex = result.plex;
                if (result.roon)
                    user.roon = result.roon;
                setUser(user)
            }
        }, () => {
        }, true)
    }, [router.isReady])


    const onGenerateClick = () => {
        errorBoundary(async () => {
            setGenerating(true);

            const generatePlaylistResult = await axios.post<OpenAISearchResponse>('/api/openai/search', {
                search: prompt,
                gpt4: gpt4
            });
            const storePlaylistResult = await axios.post(`${process.env.NEXT_PUBLIC_AIGUESTDJ_URL || "https://aiguestdj.com"}/api/playlists`, {
                ...generatePlaylistResult.data,
                user: user ? user.id : ''
            })
            router.push(`/open/${storePlaylistResult.data.id}`)
            setGenerating(false);

        }, () => {
            setGenerating(false);
        })
    }
    const sendDisabled = String(prompt).length < 8;
    return (<>
        <Head>
            <title>AI Guest DJ | Designed for Music Lovers</title>
        </Head>
        <MainLayout loading={loading} type="plex">
            <Sheet sx={{ minHeight: "calc(100vh - 120px)" }}>
                <Sheet sx={{ position: "relative", p: 1, pt: 5, pb: 18 }} variant="soft" color="primary">
                    <Box sx={{ position: "absolute", pointerEvents: "none", bottom: "-150px", left: 0, width: "100%", overflow: "hidden", height: 480 }}>
                        <Box sx={{ position: "absolute", width: "4000px", left: "50%", height: "100%", marginLeft: "-2000px", bottom:170, "& svg path": { fill: "var(--joy-palette-neutral-900, #0B0D0E)" } }}>
                            <div dangerouslySetInnerHTML={{
                                __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,192L80,176C160,160,320,128,480,133.3C640,139,800,181,960,181.3C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>`
                            }}></div>
                        </Box>
                    </Box>
                    <Box maxWidth={650} margin={"0 auto"}>
                        {error &&
                            <Box maxWidth={600} margin={"0 auto"} mt={2}>
                                <Alert color="danger" size="sm" variant="outlined">Open AI is not connected. Please update your API key and try again.</Alert>
                            </Box>
                        }
                        {!error && <>
                            <Typography level="h1" mb={.5}>Create your playlist</Typography>
                            <Typography mb={1} level="body-md">Use the field below to describe the playlist you would like to generate. For example:</Typography>
                            <Typography level="body-sm" mb={.5} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Music you would hear in a French Jazz cafe between 2010 and 2020.</Typography>
                            <Typography level="body-sm" mb={.5} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Upbeat playlist with recent music for a work out of at least 30 minutes.</Typography>
                            <Typography level="body-sm" mb={.5} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Background music I can play during a cozy dinner, should be mostly instrumental.</Typography>
                            <Typography level="body-sm" mb={.5} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Classic rock hits released between 1985 and 1995.</Typography>

                            <Box mt={2}>
                                <Input placeholder="Enter your prompt here.." disabled={generating} value={prompt} onChange={(e) => setPrompt(e.currentTarget.value)} />
                                <Box display={"flex"} justifyContent={"space-between"}>
                                    <Typography mt={1} component="label" level="body-md" startDecorator={<Switch sx={{ mr: 1 }} checked={gpt4} onChange={(e) => setGPT4(e.currentTarget.checked)}>Use GPT-4</Switch>}>
                                        Use GPT-4
                                    </Typography>
                                    <Box display={'flex'} gap={1} sx={{ mt: 1 }}>
                                        <Button loading={generating} disabled={!!sendDisabled} onClick={onGenerateClick} startDecorator={<Image style={{ opacity: sendDisabled ? .5 : 1 }} src={"/img/icon-openai.svg"} alt="Open AI logo" width={20} height={20} />}>Create playlist</Button>
                                        <IconButton variant="solid" color="warning" size="sm" onClick={() => setShowConfig(true)}><EditOutlined /></IconButton>
                                    </Box>
                                </Box>
                            </Box>
                            {gpt4 &&
                                <Alert sx={{ mt: 2 }}>Using GPT-4 you will get more meaningfull playlists, but it can take up to 60 seconds before the playlist is created.</Alert>
                            }
                        </>}
                    </Box>
                </Sheet>
                <Sheet>
                    {!user?.id &&
                        <Box maxWidth={600} margin={"0 auto"} mt={6} textAlign={"left"}>
                            <Alert color="danger">You&apos;re not signed in, your playlist will not be connected to your AI Guest DJ account.</Alert>
                        </Box>
                    }

                    {!error && profile &&
                        <Box maxWidth={600} margin={"0 auto"} mt={1} textAlign={"left"}>
                            <AccordionGroup variant="outlined">
                                <Accordion>
                                    <AccordionSummary>Prompt history & tokens spent</AccordionSummary>
                                    <AccordionDetails>
                                        <Sheet color="neutral" variant="soft">
                                            <Box p={1}>
                                                <Typography component={"div"} level="body-sm" mt={1} fontFamily={"monospace"} fontSize={"12px"} position={"relative"}>
                                                    <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{JSON.stringify(profile.requests.reverse().slice(0, 10), undefined, 2)}</pre>
                                                </Typography>
                                            </Box>
                                        </Sheet>
                                    </AccordionDetails>
                                </Accordion>
                            </AccordionGroup>
                        </Box>
                    }

                </Sheet>
            </Sheet>
        </MainLayout >

        {showConfig &&
            <OpenAISettingsDialog onClose={() => setShowConfig(false)} />
        }
    </>
    )
}

export default Page;
