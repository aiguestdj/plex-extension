import { errorBoundary } from "@aiguestdj/shared/helpers/errorBoundary";
import MainLayout from "@aiguestdj/shared/layouts/MainLayout";
import { Alert, Box, Button, CircularProgress, List, ListItem, Option, Select, Sheet, Typography } from "@mui/joy";
import axios from "axios";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import { GetAuthUrlResponse } from "./api/auth/url";
import { GetPlexResourcesResponse } from "./api/resources";
import { GetSettingsResponse } from "./api/settings";

const Page: NextPage = () => {

    const [loading, setLoading] = useState<boolean>(true)
    const [connected, setConnected] = useState<boolean>(false)
    const [validated, setValidated] = useState<boolean>(false)
    const [creatingUrl, setCreatingUrl] = useState<boolean>(false);
    const [resources, setResources] = useState<GetPlexResourcesResponse[]>([])
    const [settings, setSettings] = useState<GetSettingsResponse>()
    const [newPlexUri, setNewPlexUri] = useState<string>();
    const [saving, setSaving] = useState<boolean>(false)

    useEffect(() => {
        errorBoundary(async () => {
            const settings = await axios.get<GetSettingsResponse>("/api/settings");
            if (settings.data.loggedin) {
                if (settings.data.uri)
                    setNewPlexUri(settings.data.uri)
                setSettings(settings.data);
            } else {
                setLoading(false);
            }
        }, undefined, true)
    }, [])

    useEffect(() => {

        if (!settings) return;

        // Attempt search
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        errorBoundary(async () => {

            // Get resources
            const resources = await axios.get<GetPlexResourcesResponse[]>("/api/resources");
            setResources(resources.data)
            setConnected(true);

            // Do search (if uri is set)
            if (settings.uri) {
                const result = await axios.post("api/search", { query: "x", limit: 3 }, { signal: controller.signal })
                setValidated(true);
            }
            setLoading(false);
            clearTimeout(timeoutId);
        }, () => {
            setLoading(false)
            clearTimeout(timeoutId);
        }, true)
    }, [settings])

    const onPlexLoginClick = () => {
        setCreatingUrl(true);
        errorBoundary(async () => {
            const result = await axios.post<GetAuthUrlResponse>('/api/auth/url', {
                callback: window.location.href
            });
            if (top)
                top.location.href = result.data.authUrl;
        }, () => {
            setCreatingUrl(false);
        })
    }
    const router = useRouter();
    useEffect(() => {
        if (!router.isReady) return;
        if (router.query.plex) {
            errorBoundary(async () => {
                const result = await axios.post<{ ok: boolean }>('/api/auth/verify');
                if (result.data.ok) {
                    setLoading(true);
                    const settings = await axios.get<GetSettingsResponse>("/api/settings");
                    if (settings.data.loggedin) {
                        if (settings.data.uri)
                            setNewPlexUri(settings.data.uri)
                        setSettings(settings.data);
                    } else {
                        setLoading(false);
                    }
                }
                router.replace("/", undefined, { shallow: true })
            }, () => {
            })
        }
    }, [router.isReady])

    const onSaveClick = () => {
        // Attempt search
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        errorBoundary(async () => {
            setSaving(true);
            setValidated(false);

            const resource = resources.filter(item => item.connections.filter(connection => connection.uri == newPlexUri).length > 0)[0]
            if (!resource)
                throw new Error("Something went wrong selecting the resource")
            // Store URI
            const settings = await axios.post<GetSettingsResponse>("/api/settings", {
                uri: newPlexUri,
                id: resource.id
            });

            setSettings(settings.data);

            try {
                const result = await axios.post("api/search", { query: "x", limit: 3 }, { signal: controller.signal });
                clearTimeout(timeoutId);
                setValidated(true);
            } catch (e) {

            }
            setSaving(false)
        }, () => {
            clearTimeout(timeoutId)
            setSaving(false);
        })
    }

    const saveDisabled = !(newPlexUri && settings?.uri != newPlexUri)
    return (<>
        <Head>
            <title>AI Guest DJ | Designed for Plex</title>
        </Head>
        <MainLayout type="plex">
            <Sheet sx={{ minHeight: "calc(100vh - 120px)" }} className="verticalCenter">
                <Box textAlign={"center"}>
                    <Box display={"inline-block"} padding={'5px'} boxSizing={"border-box"} bgcolor={"var(--joy-palette-neutral-700)"} component={"span"} overflow={"hidden"} borderRadius={"50%"} width={120} height={120}>
                        <Box overflow={"hidden"} borderRadius={"50%"} width={110} height={110}>
                            <Image src={"/img/logo.png"} alt={"AI Guest DJ"} width={110} height={110} />
                        </Box>
                    </Box>
                    <Typography mb={2} level={"body-sm"}>Designed for Plex</Typography>

                    {loading &&
                        <>
                            <CircularProgress size="sm" />
                            <Box display={'flex'} justifyContent={'center'}>
                                <Alert variant="outlined">Checking your connection with Plex</Alert>
                            </Box>
                        </>
                    }
                    {!loading && connected &&
                        <>
                            <Button disabled={!validated} component="a" target="_blank" href={`${process.env.NEXT_PUBLIC_AIGUESTDJ_URL || "https://aiguestdj.com"}/?plex=${window.location.href}`}>Connect AI Guest DJ</Button>
                            <Box maxWidth={400} margin={"0 auto"} pt={3}>
                                {resources.length == 0 &&
                                    <Alert variant="outlined" color="danger">We didn&apos;t find Plex Media Servers on your account.</Alert>}

                                {resources.length > 0 &&
                                    <>
                                        <Typography mb={1} level="body-md">You are connected to Plex. Select and test the connection that you would like to use.</Typography>
                                        <Typography mb={1} level="body-md" fontWeight={600}>Select Plex Media Server</Typography>
                                        <Select defaultValue={newPlexUri} onChange={(e, value) => setNewPlexUri(value || "")}>
                                            <List>
                                                {resources.map(item => {

                                                    if (item.connections.length < 2)
                                                        return null;

                                                    return <Fragment key={item.name}>
                                                        <ListItem>
                                                            <Typography level="body-xs" textTransform="uppercase">
                                                                {item.name}
                                                            </Typography>
                                                        </ListItem>
                                                        {item.connections.map(connection => {
                                                            return <Option key={connection.uri} value={connection.uri}>{connection.uri}</Option>
                                                        })}
                                                    </Fragment>
                                                })}
                                            </List>
                                        </Select>
                                    </>}
                                {connected && !saving && !validated && settings?.uri &&
                                    <Box mt={1}>
                                        <Alert variant="outlined" size="sm" color="danger">We can&apos;t connect to the selected Plex Media Server</Alert>
                                    </Box>
                                }
                                {connected && !saving && validated && settings?.uri &&
                                    <Box mt={1}>
                                        <Alert variant="outlined" size="sm" color="success">We&apos;re connected to the selected Plex Media Server</Alert>
                                    </Box>
                                }
                                <Box mt={1}>
                                    <Button disabled={saveDisabled} loading={saving} color="neutral" onClick={onSaveClick}>Save new connection</Button>
                                </Box>
                            </Box>
                        </>
                    }
                    {!loading && !connected &&
                        <>
                            <Button loading={creatingUrl} onClick={onPlexLoginClick}>Login to Plex</Button>
                        </>
                    }
                </Box>
            </Sheet>
        </MainLayout>
    </>)
}

export default Page;
