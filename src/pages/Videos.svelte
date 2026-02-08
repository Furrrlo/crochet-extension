<script context="module" lang="ts">
    export const VIDEOS_STORE_KEY = 'videos';
</script>

<script lang="ts">
    import {extLocalStore} from "../lib/extLocalStore.svelte";
    import type {SavedVideo} from "../lib/savedVideo";
    import AddNewVideoDialog from "./AddNewVideoDialog.svelte";
    import VideoMenuCard from "./VideoMenuCard.svelte";
    import Video from "./Video.svelte";
    import {searchParams} from 'sv-router';
    import {isActive, p, navigate, route} from '../router';
    import SettingsDialog from "./SettingsDialog.svelte";
    import {sortable} from "../lib/sortable-action";
    import {flip} from "svelte/animate";

    const videos = extLocalStore(VIDEOS_STORE_KEY, [] as SavedVideo[]);

    const selectedVideoIndex = $derived.by(() => {
        return videos.value.findIndex(v => v.id === searchParams.get('v'));
    });
    const selectedVideo = $derived(selectedVideoIndex !== undefined
        ? videos.value[selectedVideoIndex]
        : undefined);

    const isSettingsPage = $derived(isActive('/settings'))
    const isAddPage = $derived(isActive('/add') || isActive('/add/:nv'))
    const newVideoUrl = $derived(isActive('/add/:nv') ? route.getParams('/add/:nv').nv : undefined)

    let addVideoModal: ReturnType<typeof AddNewVideoDialog>;
    let settingsModal: ReturnType<typeof SettingsDialog>;
    $effect(() => {
        if (isAddPage)
            addVideoModal.showModal();
        if (isSettingsPage)
            settingsModal.showModal();
    })
</script>

<div>
    <AddNewVideoDialog bind:this={addVideoModal}
                       initialUrl={newVideoUrl}
                       onClose={() => navigate('/', { search: { v: selectedVideo?.id ?? '' } })}
                       onAdd={(video) => {
        const matches = videos.value.filter(v => v.id === video.id);
        if(matches.length !== 0) {
            const matchName = matches[0].name ?? matches[0].snippet?.title ?? 'Unknown';
            return `Video was already added as "${matchName}"`;
        }

        videos.value.push(video);
        navigate('/', { search: { v: video.id } })
        return null;
    }}/>

    <SettingsDialog bind:this={settingsModal}
                    onClose={() => navigate('/', { search: { v: selectedVideo?.id ?? '' } })}/>

    {#await videos.loaded}
        <div class="h-dvh w-dvw flex items-center justify-center">
            <span class="loading loading-spinner loading-xl"></span>
        </div>
    {:then _}
        <div class="h-dvh w-dvw flex items-center justify-center">
            <div class="flex flex-col h-dvh w-64 bg-base-200 rounded-box overflow-auto">
                <ul class="menu w-full pb-0"
                    use:sortable={{
                        items: videos.value,
                        onEnd: (_, items) => videos.value = items,
                        animation: 300,
                        handle: true,
                        ghostClass: 'opacity-20',
                        chosenClass: 'bg-base-300',
                        dragClass: 'shadow-2xl',
                    }}>
                    {#each videos.value as video, i (video.id)}
                        <li animate:flip={{duration: 300}}>
                            <a class="flex {selectedVideoIndex === i ? 'menu-active' : ''}"
                               role="menuitem"
                               tabindex="0"
                               href={p('/', { search: { v: video.id } })}>
                                <VideoMenuCard bind:video={videos.value[i]}/>
                            </a>
                        </li>
                    {/each}
                </ul>
                <ul class="menu w-full grow pt-0 pb-10">
                    <li>
                        <a role="menuitem" tabindex="0" class="justify-center"
                           href={p('/add', { search: { v: selectedVideo?.id ?? '' } })}>
                            Add
                        </a>
                    </li>

                    <li class="menu-title menu-disabled menu-xs">
                        <div class="divider m-0"></div>
                    </li>

                    <li>
                        <a role="menuitem" tabindex="0" class="justify-center"
                           href={p('/settings', { search: { v: selectedVideo?.id ?? '' } })}>
                            Options
                        </a>
                    </li>
                </ul>
            </div>

            <main class="w-dvw h-dvh flex-1 overflow-hidden">
                {#each videos.value as _, i}
                    <Video visible={i === selectedVideoIndex}
                           bind:video={videos.value[i]}
                    />
                {/each}
            </main>
        </div>
    {/await}
</div>
