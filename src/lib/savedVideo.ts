import {googleApi} from "./gapi";

export type SavedVideo = {
    id: string,
    url: string,
    name?: string,
    snippet?: SavedVideoSnippet,
    parts?: VideoCrochetPart[],
}

export type VideoCrochetPart = {
    name: string;
    timestamp?: number;
    instructions?: string;
    selectedInstruction?: number;
    row?: number;
    stitch?: number;
}

export async function fetchSavedVideoSnippet(video: {
    id: string,
    url: string,
    snippet?: SavedVideoSnippet,
}): Promise<SavedVideoSnippet> {
    return await Promise.any([
        // Youtube data api
        googleApi().then(api => api.youtube().videos.list({
            id: [video.id],
            part: ['snippet', 'player'],
        }, {
            headers: {
                "If-None-Match": video.snippet?.etag ?? '',
            }
        })).then(res => {
            if (res.status == 304)
                return video.snippet!; // etag matched

            const videos = res.data.items
            if (!videos || videos.length < 1)
                throw "couldn't find video"

            const newVideo = videos[0];
            return {
                title: newVideo.snippet?.title ?? 'Missing title',
                thumbnailUrl: newVideo.snippet?.thumbnails?.default?.url ?? '',
                thumbnailHeight: newVideo.snippet?.thumbnails?.default?.height ?? 360,
                thumbnailWidth: newVideo.snippet?.thumbnails?.default?.width ?? 480,
                author: newVideo.snippet?.channelTitle ?? 'Missing author',
                embedHtml: newVideo.player?.embedHtml ?? '',
                etag: res.data.etag,
            }
        }),
        // Oembed api
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(video.url)}&format=json`)
            .then(res => res.json())
            .then(res => {
                return {
                    title: res['title'] ?? 'Missing title',
                    thumbnailUrl: res['thumbnail_url'] ?? '',
                    thumbnailHeight: res['thumbnail_height'] ?? 360,
                    thumbnailWidth: res['thumbnail_width'] ?? 480,
                    author: res['author_name'] ?? 'Missing author',
                    embedHtml: res['html'],
                    etag: video.snippet?.etag,
                }
            }),
    ])
}

export type SavedVideoSnippet = {
    title: string;
    thumbnailUrl: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
    author: string;
    embedHtml: string;
    etag?: string | null;
};