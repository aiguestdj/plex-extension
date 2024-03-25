import getAPIUrl from "./getAPIUrl";

export default function getPlexAPIUrl(_url: string, path: string, token: string) {
    const url = getAPIUrl(_url, path);
    const connector = url.indexOf('?') > 0 ? '&' : '?';
    return `${url}${connector}X-Plex-Token=${token}`
}