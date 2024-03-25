import { plex } from '@/library/plex';
import { generateError } from '@aiguestdj/shared/helpers/generateError';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRouter } from 'next-connect';

export const config = {
    api: {
        externalResolver: true,
    },
}

const router = createRouter<NextApiRequest, NextApiResponse>()
    .get(
        async (req, res, next) => {
            const { path } = req.query;

            if (!path || Array.isArray(path))
                return res.status(400).end();

            try {
                res.setHeader(
                    "Cache-Control",
                    `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
                );
                // res.setHeader("content-type", "image/png");
                // const image = await core.services.RoonApiImage.get_image(`${key}`, { scale: 'fill', width: 140, height: 140 })
                const url = path.indexOf('http') > -1 ? path : `${plex.settings.uri}${path}`;
                const connector = url.indexOf('?') > -1 ? '&' : '?';


                try {


                    // const result = readFileSync(`${url}${connector}X-Plex-Token=${plex.settings.token}`);
                    const data = await axios.get(`${url}${connector}X-Plex-Token=${plex.settings.token}`, { responseType: 'arraybuffer' })
                    res.setHeader('content-type', String(data.headers['Content-Type']))
                    res.setHeader('content-length', data.data.length)
                    return res.status(200).send(data.data)

                } catch (e) {
                    console.log(e)
                }
                // const contentType = image.content_type
                // const body = image.image

                // res.setHeader("content-type", contentType);
                // return res.status(200).send(body);
                return res.status(200).send('[ ]')
            } catch (error) {
                console.log(error)
                return res.status(404).end();
            }
        })

export default router.handler({
    onError: (err: any, req, res) => {
        generateError(req, res, "Image", err);
    },
});