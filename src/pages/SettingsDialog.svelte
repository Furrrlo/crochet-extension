<script lang="ts">
    import {extLocalStore} from "../lib/extLocalStore.svelte";
    import {GAPI_STORAGE_KEY} from "../lib/gapi";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import browser from "webextension-polyfill";
    import ExportButton from "./ExportButton.svelte";
    import CrochetDataImportButton from "./CrochetDataImportButton.svelte";
    import {VIDEOS_STORE_KEY} from "./Videos.svelte"

    let modal: HTMLDialogElement;
    const {onClose}: {
        onClose: () => void;
    } = $props();

    let gApiKey = extLocalStore<string | undefined>(GAPI_STORAGE_KEY, undefined)
    $effect(() => modal.addEventListener('toggle', () => {
        if (!modal.open)
            onClose();
    }));

    async function exportValue(): Promise<string> {
        return await browser.storage.local.get(VIDEOS_STORE_KEY).then((items) => items[VIDEOS_STORE_KEY])
    }

    export function showModal() {
        modal.showModal();
    }
</script>

<dialog class="modal" bind:this={modal}>
    <div class="modal-box max-w-md border border-base-300 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold text-xl">App Settings</h3>
            <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost">
                    <FontAwesomeIcon icon="fa-solid fa-xmark"/>
                </button>
            </form>
        </div>

        <div class="form-control w-full mb-8">
            <div class="divider text-xs uppercase tracking-widest opacity-40">API Configuration</div>

            <div class="join w-full shadow-sm">
                <div class="join-item bg-base-200 flex items-center px-4">
                    <FontAwesomeIcon icon="fa-solid fa-key" class="text-base-content/50"/>
                </div>
                <input type="password"
                       placeholder="Google API Key"
                       bind:value={gApiKey.value}
                       class="input input-bordered join-item w-full focus:outline-none focus:border-primary"/>

                {#await gApiKey.loaded}
                    <span class="loading loading-spinner loading-xs"></span>
                {/await}
            </div>
            <p class="mt-2 text-xs text-base-content/50 flex items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-shield-halved"/>
                Keep your key private and secure.
            </p>
        </div>

        <div class="divider text-xs uppercase tracking-widest opacity-40">Data Management</div>

        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between p-4 bg-base-200/50 hover:bg-base-200 transition-colors rounded-xl border border-base-300/50">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg bg-base-100 flex items-center justify-center shadow-sm">
                        <FontAwesomeIcon icon="fa-solid fa-download" class="text-primary"/>
                    </div>
                    <div>
                        <p class="font-bold text-sm">Export Data</p>
                        <p class="text-xs opacity-60">Download config to JSON</p>
                    </div>
                </div>
                <ExportButton
                        value={exportValue}
                        fileName="crochet-data.json"
                        class="btn btn-ghost btn-sm border-base-300">
                    Export
                </ExportButton>
            </div>

            <div class="flex items-center justify-between p-4 bg-base-200/50 hover:bg-base-200 transition-colors rounded-xl border border-base-300/50">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg bg-base-100 flex items-center justify-center shadow-sm">
                        <FontAwesomeIcon icon="fa-solid fa-upload" class="text-secondary"/>
                    </div>
                    <div>
                        <p class="font-bold text-sm">Import Data</p>
                        <p class="text-xs opacity-60">Upload existing config</p>
                    </div>
                </div>
                <CrochetDataImportButton class="btn btn-ghost btn-sm border-base-300">
                    Import
                </CrochetDataImportButton>
            </div>
        </div>

        <div class="modal-action">
            <form method="dialog" class="w-full">
                <button class="btn btn-block btn-primary">Close</button>
            </form>
        </div>
    </div>

    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>