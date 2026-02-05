<script lang="ts">
    import type {SavedVideo, VideoCrochetPart} from "../lib/savedVideo.ts";
    import ThreeWayConflictDialog, {type Props as ThreeWayConflictDialogProps} from "./ThreeWayConflictDialog.svelte";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import type {HTMLButtonAttributes} from "svelte/elements";
    import ImportButton from "./ImportButton.svelte";
    import {extLocalStore} from "../lib/extLocalStore.svelte";
    import {createDialog} from "../lib/dialog";
    import {VIDEOS_STORE_KEY} from "./Videos.svelte"
    import AlertToast from "./AlertToast.svelte";
    import {portal as portal0, type PortalOptions} from "@layerstack/svelte-actions";
    import type {Action} from "svelte/action";

    const props: Omit<HTMLButtonAttributes, 'onclick' | 'on:click' | 'value'> = $props();
    const localVideos = extLocalStore(VIDEOS_STORE_KEY, [] as SavedVideo[]);

    let toast = $state<{
        text: string;
        type: "error" | "info" | "warning";
    }>();

    async function onTextImport(txt: string) {
        let incomingVideos: SavedVideo[];
        try {
            incomingVideos = JSON.parse(txt);
            toast = undefined;
        } catch (e) {
            console.error("Failed to parse imported file", e)
            toast = {
                text: "Failed to parse imported file",
                type: "error",
            };
            return
        }

        await localVideos.loaded;
        await createDialog<
            { merged: SavedVideo[], local: SavedVideo[], incoming: SavedVideo[] },
            ThreeWayConflictDialogProps<SavedVideo>,
            ReturnType<typeof ThreeWayConflictDialog<SavedVideo>>
        >(ThreeWayConflictDialog<SavedVideo>, {
            props: {
                localValues: localVideos.value,
                incomingValues: incomingVideos,
                hints: {
                    id: {
                        type: 'id',
                        render: renderVideoConflictHeader
                    },
                    name: {render: 'Name'},
                    parts: {
                        name: {
                            type: 'id',
                            render: renderPartConflictHeader,
                        },
                        timestamp: {render: 'Timestamp'},
                        instructions: {type: 'textarea', render: 'Instructions'},
                        selectedInstruction: {render: 'Selected instruction'},
                        row: {render: 'Current row'},
                        stitch: {render: 'Current stitch'},
                    },
                },
            },
            onMount: (modal) => {
                const dialog = modal.dialog();
                if (dialog) dialog.showModal();
            },
        }).then((result) => {
            if (!result) {
                return toast = {
                    text: "Import canceled",
                    type: "warning",
                };
            }

            const {merged, local, incoming} = result;
            localVideos.value = merged.map(v => {
                // Restore the snippet
                const localVid = local.find(v1 => v1.id === v.id);
                const incomingVid = incoming.find(v1 => v1.id === v.id);
                return {...v, snippet: localVid?.snippet ?? incomingVid?.snippet};
            });

            toast = {
                text: "Import successful",
                type: "info",
            };
        });
    }

    const portal: Action<HTMLElement, PortalOptions> = (node, options) => portal0(node, {
        ...(typeof options === 'boolean' ? {enabled: options} : options),
        target: node.closest('dialog') ?? document.body
    })
</script>

<ImportButton {...props} onImport={onTextImport}>
    Import
</ImportButton>

{#if toast}
    <div use:portal={true}>
        <AlertToast text={toast.text}
                    type={toast.type}
                    timeoutMillis={10000}
                    onDisappear={() => toast = undefined}/>
    </div>
{/if}

{#snippet renderVideoConflictHeader({local, incoming}: {
    local?: SavedVideo,
    incoming?: SavedVideo,
})}
    <div class="badge badge-outline badge-md text-nowrap">
        <FontAwesomeIcon icon="fa-solid fa-video"/>
        Video Conflict
    </div>
    <h2 class="text-xl font-black line-clamp-1 text-ellipsis">
        {#if local?.name !== undefined && local?.name === incoming?.name}
            "{local?.name ?? incoming?.name}"
        {:else}
            "{local?.snippet?.title ?? incoming?.snippet?.title ?? 'Unknown'}"
        {/if}
    </h2>
{/snippet}

{#snippet renderPartConflictHeader({local, incoming}: {
    local?: VideoCrochetPart,
    incoming?: VideoCrochetPart,
})}
    <div class="badge badge-outline badge-sm text-nowrap">
        <FontAwesomeIcon icon="fa-solid fa-video"/>
        Part Conflict
    </div>
    <span class="line-clamp-1 text-ellipsis">
        "{local?.name ?? incoming?.name ?? ''}"
    </span>
{/snippet}