<script lang="ts">
    import type {HTMLButtonAttributes} from "svelte/elements";

    const {
        value,
        fileName,
        description = 'JSON File',
        mimeTypes = {'application/json': ['.json']},
        children,
        ...props
    }: {
        value: () => string | Promise<string>;
        fileName?: string,
        description?: string,
        mimeTypes?: Record<MIMEType, FileExtension | FileExtension[]>,
    } & Omit<HTMLButtonAttributes, 'onclick' | 'value'> = $props();

    async function onExport() {
        const str = await value();
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{description: description, accept: mimeTypes}],
                });
                const writable = await handle.createWritable();
                await writable.write(str);
                await writable.close();
                return;
            } catch (err) {
                // User canceled the picker, do nothing
                if ((err as any).name === 'AbortError') return;
                console.error("Native save failed, falling back...", err);
            }
        }
        // Fallback
        const url = URL.createObjectURL(new Blob([str], {type: Object.keys(mimeTypes)[0]}));
        const link = document.createElement('a');
        link.href = url;
        if (fileName)
            link.download = fileName;
        // In older versions of Firefox and some versions of Safari, calling .click() on an element that
        // isn't part of DOM would simply be ignored, so add a hidden one
        link.style.display = 'none';
        link.style.position = 'absolute';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Give some time to the browser to navigate to the url before revoking it
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
</script>

<button onclick={onExport} {...props}>
    {@render children?.()}
</button>