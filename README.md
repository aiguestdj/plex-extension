# AI Guest DJ Plex Extension

This is the repository for a [Plex](https://plex.tv/) extension to work with [AI Guest DJ](https://aiguestdj.com). Using this extension you can match the songs in your library with the playlist created by the AI Guest DJ GPT.

<p align="center"><a href="https://aiguestdj.com" target="_blank" rel="noopener noreferrer"><img width="100" src="https://aiguestdj.com/img/logo.png" alt="AI Guest DJ logo"></a></p>

<p align="center">
  <a href="https://www.npmjs.com/package/next"><img src="https://img.shields.io/node/v/next.svg?sanitize=true" alt="Version"></a>
</p>

------------

## Docker installation

The easiest way to use this extension is by starting a docker container. Once up and running you will find the instance at http://[ipaddress]:9020. You can change the port number by setting the `PORT` environment variable.

### Open AI API key

Your Open AI API key is stored as an environment variable of the docker instance. You can find your API keys in your [User settings of Open AI](https://platform.openai.com/api-keys). If you don't have an API key you can remove this line.

### Spotify import

To use the Import Playlist option you need a Spotify API credentials to make the connection. You can get these credentials at the [Spotify Developer site](https://developer.spotify.com/). More information can also be found at the [Gettin started section](https://developer.spotify.com/documentation/web-api) of the documentation.

### Binding volume

Binding a volume to the `/app/config` folder enables persistant storage of the configuration files. Currently the configuration is used to monitor the last requests made to Open AI. If you don't want to use persistant storage you can remove this line.

```sh
docker run -d \
    -e PORT=9020 \
    -e OPENAI_KEY=PASTE_YOUR_OPEN_AI_API_KEY_HERE \
    -e SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE \
    -e SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE \
    -v /local/directory/:/app/config:rw \
    --name=aiguestdj-plex \
    --network=host \
    --restart on-failure:4 \
    aiguestdj/plex-extension-aiguestdj
```

## Portainer installation

Create a new stack with the following configuration when using portainer.

```yaml
version: '3.3'
services:
    aiguestdj-plex:
        container_name: aiguestdj-plex
        restart: unless-stopped
        volumes:
            - '/local/directory:/app/config'
        environment:
            - PORT=9020
            - OPENAI_KEY=PASTE_YOUR_OPEN_AI_API_KEY_HERE
            - SPOTIFY_API_CLIENT_ID=PASTE_YOUR_SPOTIFY_CLIENT_ID_HERE
            - SPOTIFY_API_CLIENT_SECRET=PASTE_YOUR_SPOTIFY_CLIENT_SECRET_HERE
        network_mode: "host"
        image: 'aiguestdj/plex-extension-aiguestdj:latest'
```

## Development

The extension is build using NextJS. So you can also checkout this repo and simply use the next commands like `npm run dev`, `npm run build` and `npm run start`.
