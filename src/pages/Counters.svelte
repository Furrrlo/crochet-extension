<script lang="ts">
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import type {SvelteHTMLElements} from "svelte/elements";

    let {row = $bindable(), stitch = $bindable(), class: classNames, ...props}: {
        row?: number,
        stitch?: number,
    } & SvelteHTMLElements['div'] = $props()
</script>

<div class="flex content-center justify-center gap-3 {classNames}" {...props}>
    <div class="join grow">
        <label class="input input-md join-item grow">
            Row:
            <input type="number" class="input-md" bind:value={row} min="0"/>
        </label>
        <button class="btn btn-md btn-accent join-item" onclick="{() => {
            row = (row ?? 0) + 1;
            stitch = 0;
        }}">
            <FontAwesomeIcon icon="fa-solid fa-plus"/>
        </button>
        <button class="btn btn-md btn-error join-item" onclick="{() => {
            row = Math.max((row ?? 0) - 1, 0);
        }}">
            <FontAwesomeIcon icon="fa-solid fa-minus"/>
        </button>
    </div>

    <div class="join grow">
        <label class="input input-md join-item grow">
            Stitch:
            <input type="number" class="input-md" bind:value={stitch} min="0"/>
        </label>
        <button class="btn btn-md btn-accent join-item" onclick="{() => {
            stitch = (stitch ?? 0) + 1;
        }}">
            <FontAwesomeIcon icon="fa-solid fa-plus"/>
        </button>
        <button class="btn btn-md btn-error join-item" onclick="{() => {
            stitch = Math.max((stitch ?? 0) - 1, 0);
        }}">
            <FontAwesomeIcon icon="fa-solid fa-minus"/>
        </button>
    </div>
</div>