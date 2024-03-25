import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout from "@aiguestdj/shared/layouts/MainLayout";
import { OpenAISearchResponse } from "@aiguestdj/shared/types/PostOpenAISearchResponse";
import { KeyboardArrowRightSharp } from "@mui/icons-material";
import { Alert, Box, Button, Input, Sheet, Switch, Typography } from "@mui/joy";
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Page: NextPage = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [prompt, setPrompt] = useState<string>('')
    const [gpt4, setGPT4] = useState<boolean>(false);

    const [generating, setGenerating] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        errorBoundary(async () => {
            await axios.get('/api/openai/profile');
            setLoading(false);
        }, () => {
            setLoading(false)
            setError(true);
        }, true)
    }, [])

    const onGenerateClick = () => {

        errorBoundary(async () => {
            setGenerating(true);

            const generatePlaylistResult = await axios.post<OpenAISearchResponse>('/api/openai/search', {
                search: prompt,
                gpt4: gpt4
            });
            const storePlaylistResult = await axios.post(`https://aiguestdj.com/api/playlists`, generatePlaylistResult.data)
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
        <MainLayout loading={loading}>
            <Sheet sx={{ position: "relative", p: 1, pt: 14, pb: 18 }} variant="soft" color="primary">
                <Box sx={{ position: "absolute", pointerEvents: "none", bottom: "-150px", left: 0, width: "100%", overflow: "hidden", height: 480 }}>
                    <Box sx={{ position: "absolute", width: "2500px", left: "50%", height: "100%", marginLeft: "-1250px", "& svg path": { fill: "var(--joy-palette-neutral-900, #0B0D0E)" } }}>
                        <div dangerouslySetInnerHTML={{
                            __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,192L80,176C160,160,320,128,480,133.3C640,139,800,181,960,181.3C1120,181,1280,139,1360,117.3L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>`
                        }}></div>
                    </Box>
                </Box>

                <Box maxWidth={650} margin={"0 auto"}>
                    {error && <>
                        <Typography level="h1">Could not connect to your Open AI extension</Typography>
                        <Typography mb={1} level="body-md">It seem that there is something wrong with the Open AI connection. You need to add your own Open AI API key in order to use this feature. </Typography>
                    </>}
                    {!error && <>
                        <Typography level="h1">Describe your new playlist</Typography>
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
                                <Button sx={{ mt: 1 }} loading={generating} disabled={!!sendDisabled} onClick={onGenerateClick} startDecorator={<Image style={{ opacity: sendDisabled ? .5 : 1 }} src={"/img/icon-openai.svg"} alt="Open AI logo" width={20} height={20} />}>Create playlist</Button>
                            </Box>
                        </Box>

                        {gpt4 &&
                            <Alert sx={{ mt: 2 }}>Using GPT-4 you will get more meaningfull playlists, but it can take up to 60 seconds before the playlist is created.</Alert>
                        }
                    </>}
                </Box>
            </Sheet>
        </MainLayout >


    </>
    )
}

export default Page;
