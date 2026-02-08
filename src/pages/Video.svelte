<script lang="ts">
    import {useSWR} from "sswr";
    import {
        fetchSavedVideoSnippet,
        type SavedVideo,
        type SavedVideoSnippet
    } from "../lib/savedVideo";
    import VideoEmbed from "./VideoEmbed.svelte";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import VideoCrochetPartComponent from "./VideoCrochetPart.svelte";
    import {sortable, sortableHandle} from "../lib/sortable-action";

    let {video = $bindable(), visible = true}: {
        video: SavedVideo,
        visible?: boolean,
    } = $props()
    useSWR<SavedVideoSnippet>(video.id, {
        fetcher: async () => {
            const snippet = await fetchSavedVideoSnippet(video);
            video.snippet = snippet;
            return snippet;
        },
        initialData: video.snippet,
    });

    const tabs = [1, 2, 3, 4, 5, 6];
    let canEdit = $state(false)
    let selectedInstructionsTab: number | undefined = $state(tabs.length > 0 ? 0 : undefined);

    let editedVideo = $state<SavedVideo>($state.snapshot(video));
    let currentVideo = $derived((canEdit ? editedVideo : video) ?? video)

    const onEditSaveButton = (() => {
        const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };

        $effect(() => {
            if (!visible) {
                canEdit = false;
                window.removeEventListener("beforeunload", beforeUnloadHandler);
            }
        });

        return () => {
            const wasEditing = canEdit
            canEdit = !canEdit;
            if (!wasEditing) {
                window.addEventListener("beforeunload", beforeUnloadHandler);
                editedVideo = $state.snapshot(video);
            } else {
                window.removeEventListener("beforeunload", beforeUnloadHandler);
                editedVideo.snippet = video.snippet;
                video = editedVideo;
            }
        };
    })();
</script>

<div class="flex flex-col justify-center w-full h-dvh box-border p-8 gap-3 overflow-hidden {visible ? '' : 'hidden'}">
    <div class="w-full join">
        <input type="text"
               class="w-full input join-item"
               placeholder="Project name"
               bind:value={currentVideo.name}
               disabled={!canEdit}>
        <button class="btn btn-accent join-item" onclick="{onEditSaveButton}">
            {#if canEdit}
                <FontAwesomeIcon icon="fa-regular fa-floppy-disk"/>
            {:else}
                <FontAwesomeIcon icon="fa-regular fa-pen-to-square"/>
            {/if}
        </button>
    </div>
    <div class="flex flex-1 grow w-full gap-3">
        <VideoEmbed embedHtml={video.snippet?.embedHtml}/>
        <div>
            <h2 class="text-2xl">{video.snippet?.title}</h2>
            <p class="text-xs font-semibold opacity-60">{video.snippet?.author}</p>
        </div>
    </div>
    <div class="flex flex-col h-74 w-full bg-base-200 rounded-md relative">
        <div class="absolute top-0 left-0 pt-1 px-1 bg-base-200 rounded-md z-2">
            <button class="btn btn-square btn-primary" onclick="{() => {
                const parts = editedVideo.parts ?? [];
                parts.push({ name: 'Part ' + (1+parts.length) })
                editedVideo.parts = parts;

                selectedInstructionsTab = parts.length - 1;
            }}" disabled={!canEdit}>
                <FontAwesomeIcon icon="fa-solid fa-plus"/>
            </button>
        </div>
        <div class="flex flex-col flex-1 grow h-0 w-full overflow-x-auto">
            <div role="tablist"
                 class="tabs tabs-box min-w-max justify-center pl-11"
                 use:sortable={{
                    items: currentVideo.parts ?? [],
                    onEnd: (_, items) => currentVideo.parts = items,
                    animation: 300,
                    handle: true,
                    ghostClass: 'opacity-20',
                    chosenClass: 'bg-base-300',
                    dragClass: 'shadow-2xl',
                 }}>
                {#each (currentVideo.parts ?? []) as part, i (part.name)}
                    <a role="tab"
                       class="tab {i === selectedInstructionsTab ? 'tab-active' : '' }"
                       onclick={() => selectedInstructionsTab = i}>
                        {#if canEdit}
                            <div class="p-1 opacity-50 hover:opacity-100"
                                 use:sortableHandle
                                 aria-label="drag-handle for {part.name}">
                                <FontAwesomeIcon icon="fa-solid fa-grip-vertical"/>
                            </div>
                        {/if}
                        {part.name}
                    </a>
                {/each}
            </div>
            <div class="flex flex-col flex-1 grow h-0 mb-1 sticky start-0 overflow-auto">
                <div class="flex flex-col grow mx-1 border-base-300 bg-base-100 p-2">
                    {#if currentVideo.parts
                    && selectedInstructionsTab !== undefined
                    && currentVideo.parts[selectedInstructionsTab]
                    }
                        <VideoCrochetPartComponent bind:part={currentVideo.parts[selectedInstructionsTab]}
                                                   editable={canEdit}
                                                   pipProps={{
                                                      get video() { return video; },
                                                      set video(v) { video = v; },
                                                      partIdx: selectedInstructionsTab,
                                                  }}
                                                   onRemove={() => {
                                                      if(selectedInstructionsTab)
                                                        currentVideo.parts?.splice(selectedInstructionsTab, 1);
                                                  }}/>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
