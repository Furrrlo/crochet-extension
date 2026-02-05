<script lang="ts">
    import type {Snippet} from "svelte";

    let {text, children, type, timeoutMillis, trackVisibility = true, onDisappear}: {
        text?: string,
        children?: Snippet,
        type: "error" | "warning" | "info",
        timeoutMillis?: number,
        trackVisibility?: boolean,
        onDisappear?: () => void,
    } = $props();

    const alertClass = $derived.by(() => {
        switch (type) {
            case "error":
                return "alert-error";
            case "warning":
                return "alert-warning";
            case "info":
                return "alert-info";
            default:
                throw new Error(`Unknown type: ${type satisfies never}`);
        }
    });

    let visible = $state(true);
    $effect(() => {
        if (timeoutMillis === undefined)
            return;

        setTimeout(() => {
            visible = false;
            onDisappear?.();
        }, timeoutMillis)
    });

    let tgt: HTMLDivElement;
    $effect(() => {
        if (!tgt || !trackVisibility) return;

        const obs = new IntersectionObserver((entries) => entries.forEach(entry => {
            if (entry.isVisible !== undefined && !entry.isVisible) {
                visible = false;
                onDisappear?.();
            }
        }), {
            trackVisibility: true,
            delay: 1000,
        });
        obs.observe(tgt)
        return () => obs.disconnect();
    })
</script>

<div bind:this={tgt}
     class="toast toast-center toast-top {visible ? '' : 'hidden'}">
    <div role="alert" class="alert {alertClass}">
        {#if type === "error"}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                 viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        {:else if type === "warning"}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                 viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        {:else if type === "info"}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none"
                 viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        {/if}

        {#if text !== undefined}
        <span class="text-ellipsis">
            {text}
        </span>
        {:else if children !== undefined}
            {@render children()}
        {/if}
    </div>
</div>