<script lang="ts">
    import type {VideoCrochetPart} from "../lib/savedVideo";
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import HighlitableInstructions from "./HighlitableInstructions.svelte";
    import {type ComponentProps, mount} from "svelte";
    import DocumentPiP from "./DocumentPiP.svelte";
    import Counters from "./Counters.svelte";

    let {part = $bindable(), editable, onRemove, pipProps = $bindable()}: {
        part: VideoCrochetPart,
        editable: boolean,
        onRemove?: () => void,
        pipProps: ComponentProps<typeof DocumentPiP>,
    } = $props()

    let warnPip = $state(false)

    onRemove = onRemove ?? (() => {
    });

    const onPiP = async () => {
        if (!window.documentPictureInPicture) {
            warnPip = true;
            return;
        }

        let pipWindow;
        try {
            pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 500,
                height: 300,
            })
        } catch (e) {
            console.error("Failed to request Document PiP window", e)
            warnPip = true;
            return;
        }

        warnPip = false;
        // Copy style sheets over
        [...document.styleSheets].forEach((styleSheet) => {
            const cssRules = [...styleSheet.cssRules]
                .map((rule) => rule.cssText)
                .join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
        });
        // Set body to 100%
        pipWindow.document.body.classList.add("h-dvh", "w-dvw")
        // Mount svelte component
        mount(DocumentPiP, {
            target: pipWindow.document.body,
            props: {
                ...pipProps,
                ...{
                    // bindable props
                    get video() {
                        return pipProps.video;
                    },
                    set video(v) {
                        pipProps.video = v;
                    },
                },
            },
        });
    }
</script>

<div class="flex grow h-0 w-full overflow-hidden">
    <div class="card bg-base-300 w-full max-w-md shrink-0 shadow-2xl">
        <div class="card-body p-3 gap-1">
            <fieldset class="fieldset">
                <label class="input w-full">
                    Name:
                    <input type="text" class="input" placeholder="Part name" bind:value={part.name}
                           disabled={!editable}/>
                </label>
                <label class="input w-full">
                    Timestamp:
                    <input type="time" class="input join-item" disabled={!editable}/>
                </label>
                <Counters class="mt-1" bind:row={part.row} bind:stitch={part.stitch}/>
            </fieldset>
            <div class="flex-1 h-0 -m-1 grow"></div>
            <div class="flex gap-1 w-full">
                <button class="grow btn btn-primary" onclick={onPiP}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         class="lucide lucide-picture-in-picture2-icon lucide-picture-in-picture-2">
                        <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/>
                        <rect width="10" height="7" x="12" y="13" rx="2"/>
                    </svg>
                </button>
                <button class="grow btn btn-error" disabled={!editable} onclick={onRemove}>
                    <FontAwesomeIcon icon="fa-solid fa-trash"/>
                </button>
            </div>
        </div>
    </div>

    <div class="flex-1 grow overflow-auto">
        {#if editable}
            <textarea class="input w-full h-full resize-none wrap-break-word text-wrap" bind:value={part.instructions}/>
        {:else}
            <HighlitableInstructions class="p-4" style="user-select: none;"
                                     instructions={part.instructions}
                                     bind:selected={part.selectedInstruction}/>
        {/if}
    </div>
</div>

{#if warnPip}
    <div class="toast toast-top toast-center">
        <div role="alert" class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                 viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>
            Document PiP is not supported, see compatibility
            <a class="link"
               href="https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API#browser_compatibility">
                here
            </a>
        </span>
        </div>
    </div>
{/if}
