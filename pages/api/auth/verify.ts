import { plex } from '@/library/plex';
import { GetPlexPinResponse } from '@/types/PlexAPI';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

const router = createRouter<NextApiRequest, NextApiResponse>()
    .post(
        async (req, res, next) => {
            const result = await axios.get<GetPlexPinResponse>(`https://plex.tv/api/v2/pins/${plex.settings.pin_id}`, {
                params: {
                    code: plex.settings.pin_code,
                    "X-Plex-Client-Identifier": process.env.PLEX_APP_ID,
                    "X-Plex-Features": "external-media%2Cindirect-media%2Chub-style-list",
                    "X-Plex-Model": "hosted",
                }
            })

            plex.saveConfig({ token: result.data.authToken })
            res.json({
                ok: true
            })
        })

export default router.handler({
    onError: (err: any, req, res) => {
        console.log(err);
        generateError(req, res, "Plex Authentication", err);
    },
});


