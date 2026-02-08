<script lang="ts">
    import {useSWR} from "sswr";
    import {fetchSavedVideoSnippet, type SavedVideo, type SavedVideoSnippet} from "../lib/savedVideo";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import {sortableHandle} from "../lib/sortable-action";

    let {video = $bindable()}: { video: SavedVideo } = $props()
    useSWR<SavedVideoSnippet>(video.id, {
        fetcher: async () => {
            const snippet = await fetchSavedVideoSnippet(video);
            video.snippet = snippet;
            return snippet;
        },
        initialData: video.snippet,
    });

    const displayName = $derived(video.name && video.name !== '' ? video.name : video.snippet?.title ?? 'Unknown')
</script>

<div class="flex flex-col gap-2 w-full h-full justify-center">
    <!--{#if (video.snippet?.thumbnailUrl)}-->
    <!--    <img src={video.snippet?.thumbnailUrl} alt="thumbnail" class="w-full"/>-->
    <!--{:else}-->
    <!--    <div class="skeleton h-32 w-40"></div>-->
    <!--{/if}-->

    <div class="flex gap-2 justify-center items-center w-full">
        <div class="flex flex-col grow">
            <h3 class="line-clamp-2 text-ellipsis">{displayName}</h3>
            <p class="text-xs font-semibold opacity-60">{video.snippet?.author ?? 'Unknown'}</p>
        </div>

        <div class="p-1 opacity-50 hover:opacity-100"
             use:sortableHandle
             aria-label="drag-handle for {displayName}">
            <FontAwesomeIcon icon="fa-solid fa-grip-vertical"/>
        </div>
    </div>
</div>
