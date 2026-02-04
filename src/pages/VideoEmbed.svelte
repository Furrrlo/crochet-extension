<script lang="ts">
    import DOMPurify, {type UponSanitizeElementHook} from "dompurify";
    import browser from "webextension-polyfill";
    import type {SvelteHTMLElements} from "svelte/elements";

    const {embedHtml, class: classNames, ruleId = 1, filterByTab = true, ...restProps}: SvelteHTMLElements['div'] & {
        embedHtml?: string,
        ruleId?: number,
        filterByTab?: boolean,
    } = $props();

    const spoofedHostname = "www.youtube-nocookie.com";
    const sanitizedEmbed = $derived.by(() => {
        const hook: UponSanitizeElementHook = (node, data) => {
            if (data.tagName === 'iframe') {
                const src = (node as HTMLElement).getAttribute('src') || ''
                if (!src.startsWith('https://www.youtube.com/embed/') &&
                    !src.startsWith('//www.youtube.com/embed/') &&
                    !src.startsWith('https://www.youtube-nocookie.com/embed/')) {
                    return node.parentNode?.removeChild(node)
                }
            }
        }

        DOMPurify.addHook('uponSanitizeElement', hook)
        const sanitizedHtml = DOMPurify.sanitize(embedHtml ?? '', {
            ALLOWED_TAGS: ["iframe"],
            ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
            RETURN_DOM_FRAGMENT: true,
        });
        DOMPurify.removeHook('uponSanitizeElement', hook)

        const iframe = sanitizedHtml.querySelector('iframe')
        if (!iframe)
            return sanitizedHtml.firstElementChild?.outerHTML ?? '';

        // Remove width and height
        iframe.width = "";
        iframe.height = "";
        // Manually add https if missing, as the YT api seems to omit it
        // Note the use of the getAttribute() method, as otherwise Firefox would return one with 'moz-extension:' prepended
        if (iframe.getAttribute('src')?.startsWith("//")) {
            iframe.src = "https:" + iframe.getAttribute('src')
        }

        const parsedUrl = URL.parse(iframe.src);
        if (!parsedUrl)
            return iframe.outerHTML;

        parsedUrl.protocol = "https";
        parsedUrl.hostname = spoofedHostname;
        // To fix ads related error, see https://stackoverflow.com/a/51673759
        parsedUrl.searchParams.append("origin", spoofedHostname);

        iframe.src = parsedUrl.toString();
        return iframe.outerHTML;
    });

    // Bypass limitations preventing embedded videos
    let installedRefererHack = $state(false)
    $effect(() => {
        (async () => await browser.declarativeNetRequest.updateSessionRules({
            // Apparently this is a good idea https://stackoverflow.com/a/79108934
            removeRuleIds: [ruleId],
            addRules: [{
                id: ruleId,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [
                        // hehehe big joke we are youtube!!!!
                        {header: "Referer", operation: "set", value: `https://${spoofedHostname}`},
                        {header: "Origin", operation: "set", value: `https://${spoofedHostname}`},
                    ],
                },
                condition: {
                    requestDomains: ["www.youtube.com", "www.youtube-nocookie.com"],
                    resourceTypes: ["main_frame", "sub_frame"],
                    tabIds: filterByTab
                        ? await browser.tabs.getCurrent().then(tab => tab.id ? [tab.id] : undefined)
                        : undefined,
                }
            }]
        }).then(() => {
            installedRefererHack = true;
        }))()

        return () => {
            if (installedRefererHack)
                browser.declarativeNetRequest.updateSessionRules({removeRuleIds: [ruleId]})
        }
    })
</script>

<div class="iframe-container aspect-video {classNames}" {...restProps}>
    {#if !installedRefererHack}
        <div class="skeleton h-full w-full"></div>
    {:else}
        {@html sanitizedEmbed}
    {/if}
</div>

<style>
    .iframe-container > :global(iframe) {
        width: 100% !important;
        height: 100% !important;
    }
</style>