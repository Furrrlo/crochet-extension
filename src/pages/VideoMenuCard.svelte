<script lang="ts">
    import {useSWR} from "sswr";
    import {fetchSavedVideoSnippet, type SavedVideo, type SavedVideoSnippet} from "../lib/savedVideo";

    let {video = $bindable()}: { video: SavedVideo } = $props()
    useSWR<SavedVideoSnippet>(video.id, {
        fetcher: async () => {
            const snippet = await fetchSavedVideoSnippet(video);
            video.snippet = snippet;
            return snippet;
        },
        initialData: video.snippet,
    });
</script>

<div>
    <div class="flex flex-col gap-2 w-full justify-center">
        <!--{#if (video.snippet?.thumbnailUrl)}-->
        <!--    <img src={video.snippet?.thumbnailUrl} alt="thumbnail" class="w-full"/>-->
        <!--{:else}-->
        <!--    <div class="skeleton h-32 w-40"></div>-->
        <!--{/if}-->

        <div class="flex flex-col">
            <h3 class="line-clamp-2 text-ellipsis">
                {video.name && video.name !== '' ? video.name : video.snippet?.title ?? 'Unknown'}
            </h3>
            <p class="text-xs font-semibold opacity-60">{video.snippet?.author ?? 'Unknown'}</p>
        </div>
    </div>
</div>
