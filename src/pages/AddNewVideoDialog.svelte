<script lang="ts">
    import {fetchSavedVideoSnippet, type SavedVideo, type SavedVideoSnippet} from "../lib/savedVideo";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";

    let modal: HTMLDialogElement;
    const {initialUrl, onAdd, onClose}: {
        initialUrl?: string;
        onAdd: (video: SavedVideo) => string | null | undefined;
        onClose: () => void;
    } = $props();

    let url = $state<string>(initialUrl ?? '');
    let addError = $state<string | undefined>()
    $effect(() => modal.addEventListener('toggle', () => {
        if (modal.open) {
            url = initialUrl ?? '';
        } else {
            onClose();
        }
        addError = undefined;
    }));

    const {videoId, errorText: idErrorText}: {
        videoId?: string,
        errorText?: string,
    } = $derived.by(() => {
        if (url === '') {
            return {};
        }

        const idRegex = /^.*(youtu\.be\/|vi?\/|u\/\w\/|embed\/|\?vi?=|&vi?=)([^#&?]*).*/
        const parsed = url.match(idRegex);
        if (!parsed || !parsed[2]) {
            return {errorText: "Failed to extract YT video id"};
        }

        return {videoId: parsed[2]};
    });

    const parsingState: Promise<{
        videoInfo?: SavedVideoSnippet,
        errorText?: string,
    }> = $derived.by(async () => {
        if (!videoId || idErrorText) {
            return {errorText: idErrorText}
        }

        try {
            return {videoInfo: await fetchSavedVideoSnippet({id: videoId!, url: url})}
        } catch (e) {
            console.error("Failed to fetch video", e);
            return {errorText: "Failed to fetch video",}
        }
    });

    const errorText = $derived.by(async () => {
        if (addError) {
            return addError;
        }

        return (await parsingState).errorText || addError;
    })

    export function showModal() {
        modal.showModal();
    }

    async function pasteUrl() {
        url = await navigator.clipboard.readText()
        addError = undefined;
    }

    async function onAddBtn() {
        const errTxt = onAdd({
            id: videoId!,
            url: url,
            snippet: (await parsingState).videoInfo,
        });
        if (!errTxt) {
            return modal.close();
        }

        addError = errTxt;
    }
</script>

<dialog class="modal" bind:this={modal}>
    <div class="modal-box space-y-2">
        <h3 class="text-lg font-bold">Add new video</h3>
        <div class="join w-full">
            <button class="btn btn-neutral join-item" onclick={pasteUrl}>
                <FontAwesomeIcon icon="fa-regular fa-paste"/>
            </button>
            <input type="text" placeholder="Paste URL" class="input w-full join-item" bind:value={url}/>
        </div>

        {#if videoId}
            {#await parsingState}
                <div class="flex items-start gap-4 w-full">
                    <div class="skeleton h-32 w-40"></div>
                    <div class="flex flex-col gap-4 mt-2 flex-2">
                        <div class="skeleton h-4 w-full"></div>
                        <div class="skeleton h-4 w-28"></div>
                        <div class="skeleton h-4 w-28"></div>
                    </div>
                </div>
            {:then {videoInfo}}
                {#if videoInfo}
                    <div class="flex items-start gap-4 w-full">
                        <img src={videoInfo.thumbnailUrl} alt="thumbnail" class="h-32"/>
                        <div class="flex flex-col mt-2 flex-2">
                            <h3>{videoInfo.title}</h3>
                            <p class="text-xs font-semibold opacity-60">{videoInfo.author}</p>
                            <p class="text-xs font-semibold opacity-60">{videoId}</p>
                        </div>
                    </div>
                {/if}
            {/await}
        {/if}

        {#snippet addBtn(disabled)}
            <button type="button" class="btn btn-primary float-end mt-2" disabled={disabled} onclick={onAddBtn}>
                Add
            </button>
        {/snippet}

        {#await parsingState}
            {@render addBtn(true)}
        {:then {videoInfo}}
            {@render addBtn(!videoInfo)}
        {/await}
    </div>

    {#await errorText}
    {:then errorText}
        {#if errorText}
            <div class="toast toast-center toast-top">
                <div role="alert" class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                         viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-ellipsis">{errorText}</span>
                </div>
            </div>
        {/if}
    {/await}

    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>