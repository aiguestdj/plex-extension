import { plex } from '@/library/plex';
import { PostPinResponse } from '@/types/PlexAPI';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';
import { stringify } from 'qs';


export type GetAuthUrlResponse = {
    authUrl: string
}
const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {

            const result = await axios.post<PostPinResponse>("https://plex.tv/api/v2/pins", stringify({
                strong: true,
                "X-Plex-Product": "AI Guest DJ",
                "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
            }))

            const authUrl =
                'https://app.plex.tv/auth#?' +
                stringify({
                    clientID: process.env.PLEX_APP_ID,
                    code: result.data.code,
                    forwardUrl: `${req.body.callback}?plex=1`,
                    context: {
                        device: {
                            product: 'AI Guest DJ',
                        },
                    },
                });


            plex.saveConfig({ pin_id: `${result.data.id}`, pin_code: `${result.data.code}` })
            res.json({
                authUrl: authUrl
            })
        })

export default router.handler({
    onError: (err: any, req, res) => {
        console.log(err);
        generateError(req, res, "Plex Authentication", err);
    },
});


