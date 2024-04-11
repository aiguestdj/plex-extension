import { AxiosRequest } from '@/helpers/AxiosRequest';
import getAPIUrl from '@/helpers/getAPIUrl';
import { plex } from '@/library/plex';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export type GetSettingsResponse = {
    loggedin: boolean
    uri?: string,
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {
            if (!plex.settings.uri || !plex.settings.token) {
                return res.status(400).json({ msg: "No plex connection found" });
                return;
            }

            // Check the existence
            let url = getAPIUrl(plex.settings.uri, `/playlists/66012/items?type=audio`);
            // const url = getAPIUrl(plex.settings.uri, `/library/metadata/5b888afc00a1e90031fe134f`);
            // const url = `https://discover.provider.plex.tv/library/metadata/5b888afc00a1e90031fe1344`
            // const url = getPlexAPIUrl(plex.settings.uri, `/library/metadata/33932`, plex.settings.token);
            const query = 'Surfing To Some F#*ked Up S@!t';
            const limit = 5;
            url = `https://discover.provider.plex.tv/library/search?query=${encodeURIComponent(query)}&limit=${limit}&searchTypes=music&searchProviders=discover%2CplexAVOD%2Ctidal`;

            const result = await AxiosRequest.get<any>(url, plex.settings.token);
            console.log(result.data.MediaContainer.SearchResults[0].SearchResult)

            //////////////////////////////////////////////////////
            //
            // DONOT REMOVE
            //
            // THIS CAN BE USED FOR TL_DL
            //
            // The Media.Part contains a key which contains the track id
            // /library/parts/9737002-LOSSLESS <---- track id: 9737002
            // 
            // If downloading this with meta data we could also find the 
            // album id maybe?
            //
            //////////////////////////////////////////////////////

            // @ts-ignore
            // console.log(result.data.MediaContainer.Metadata[result.data.MediaContainer.Metadata.length - 1])
            // console.log(result.data.MediaContainer.Metadata[result.data.MediaContainer.Metadata.length - 1].Media.map(item => item.Part))
            res.json({ loggedin: !!plex.settings.token, uri: plex.settings.uri })
        })


export default router.handler({
    onNoMatch: (req, res) => {
        res.status(200).json({})
    },
    onError: (err: any, req, res) => {
        console.log(err)
        generateError(req, res, "Songs", err);
    }
});


