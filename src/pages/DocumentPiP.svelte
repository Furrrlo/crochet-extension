<script lang="ts">
    import {useSWR} from "sswr";
    import {fetchSavedVideoSnippet, type SavedVideo, type SavedVideoSnippet} from "../lib/savedVideo";
    import HighlitableInstructions from "./HighlitableInstructions.svelte";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import Counters from "./Counters.svelte";

    const {video = $bindable(), partIdx}: {
        video: SavedVideo,
        partIdx: number,
    } = $props()
    const part = $derived(video.parts?.[partIdx]);

    useSWR<SavedVideoSnippet>(video.id, {
        fetcher: async () => {
            const snippet = await fetchSavedVideoSnippet(video);
            video.snippet = snippet;
            return snippet;
        },
        initialData: video.snippet,
    });
</script>

<div class="flex h-full w-full">
    <!--    <VideoEmbed class="flex-1 max-w-1/2"-->
    <!--                ruleId={2}-->
    <!--                filterByTab={false}-->
    <!--                embedHtml={video.snippet?.embedHtml}/>-->
    {#if part}
        <div class="flex flex-col h-full flex-1 gap-3 p-3">
            <div class="flex justify-center">
                <Counters class="w-100" bind:row={part.row} bind:stitch={part.stitch}/>
            </div>
            <HighlitableInstructions class="flex-1 grow h-0 overflow-auto"
                                     instructions={part.instructions}
                                     bind:selected={part.selectedInstruction}/>
        </div>
    {/if}
</div>