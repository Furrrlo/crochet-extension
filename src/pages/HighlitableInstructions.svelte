<script lang="ts">
    import type {SvelteHTMLElements} from "svelte/elements";

    let {instructions, selected = $bindable(), class: className, ...rest}: SvelteHTMLElements['div'] & {
        instructions?: string,
        selected?: number,
    } = $props();

    const split = $derived.by(() => (instructions ?? '').split("\n"))
</script>

<div class="flex flex-col gap-2 {className}" {...rest}>
    {#each split as line, i}
        <p class="text-md cursor-pointer" onclick="{() => selected = i}">
            {#if i === selected}
                <mark>{line}</mark>
            {:else}
                {line}
            {/if}
        </p>
    {/each}
</div>