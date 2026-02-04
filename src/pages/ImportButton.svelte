<script lang="ts">
    import type {HTMLButtonAttributes} from "svelte/elements";

    const {
        onImport,
        description = 'JSON File',
        mimeTypes = {'application/json': ['.json']},
        children,
        ...props
    }: {
        onImport: (v: string) => any,
        description?: string,
        mimeTypes?: Record<MIMEType, FileExtension | FileExtension[]>,
    } & Omit<HTMLButtonAttributes, 'onclick' | 'value'> = $props();

    async function onImportBtn() {
        const text = await readImportText();
        if (text)
            onImport(text);
    }

    async function readImportText(): Promise<string | undefined | null> {
        if ('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{description: description, accept: mimeTypes}],
                    multiple: false
                });
                const file = await handle.getFile();
                return await file.text();
            } catch (err) {
                if ((err as Error).name === 'AbortError')
                    return null;

                console.error("Native import failed", err);
            }
        }

        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = Object.entries(mimeTypes).map(([key, value]) => `${key},${value}`)[0];
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                resolve(file ? await file.text() : null)
            };
            input.click();
        });
    }
</script>

<button onclick={onImportBtn} {...props}>
    {@render children?.()}
</button>