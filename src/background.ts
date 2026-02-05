/// <reference types="serviceworker" />

import browser, {type WebRequest} from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener(async (details) => {
    console.log("Extension installed:", details);
});

async function createOrActivateTab({newPath, replace}: {
    newPath: string,
    replace?: boolean,
}) {
    const tabs = await browser.tabs.query({url: browser.runtime.getURL("") + "*"});
    if (tabs.length > 0) {
        return browser.tabs.update(tabs[0].id, {
            active: true,
            url: replace ? browser.runtime.getURL(newPath) : undefined,
        });
    } else {
        return browser.tabs.create({url: browser.runtime.getURL(newPath)});
    }
}

(() => browser.action
        ? browser.action
        : browser.browserAction
            ? browser.browserAction
            : undefined
)()?.onClicked.addListener(() => {
    return createOrActivateTab({newPath: ""})
})

browser.runtime.onMessage.addListener(async (message) => {
    if (message.type !== 'crochet-create-yt-project')
        return

    const href = message.href as string;
    await createOrActivateTab({
        newPath: "/add/" + encodeURIComponent(href),
        replace: true,
    })
})

async function onExtensionResourceRequest({url, respondWith, type, event}: {
    url: string,
    type: WebRequest.ResourceType | RequestDestination,
    respondWith: (url: string, options?: { redirect?: boolean }) => void | Promise<void>,
    event: any,
}) {
    if (type !== "document"
        || url.endsWith(".js")
        || url.endsWith(".ts")
        || url.endsWith(".css")
        || url.endsWith(".svelte"))
        return;

    if (url.endsWith("/src/options.html")) {
        await respondWith(browser.runtime.getURL("/settings"), {redirect: true})
    } else {
        await respondWith(browser.runtime.getURL("src/index.html"))
    }
}

addEventListener('fetch', (event) => onExtensionResourceRequest({
    event,
    url: event.request.url,
    type: event.request.destination,
    respondWith: (url, opts) => event.respondWith(opts?.redirect
        ? Response.redirect(url)
        : fetch(url))
}))

if (browser.webRequest) {
    const urlFilter = browser.runtime.getURL("");
    browser.webRequest.onBeforeRequest.addListener(async (event) => {
        let redirectUrl: string | undefined;
        await onExtensionResourceRequest({
            event,
            url: event.url,
            type: event.type,
            respondWith: async (url, opts) => {
                if (opts?.redirect) {
                    redirectUrl = url;
                    return;
                }

                const data = await fetch(url).then(res => res.bytes());
                const filter = browser.webRequest.filterResponseData(event.requestId);
                filter.onstart = () => {
                    filter.write(data);
                    filter.close();
                    filter.disconnect();
                };
            },
        })
        return {
            redirectUrl: redirectUrl
        };
    }, {urls: [urlFilter]}, ["blocking"]);

    browser.webRequest.onHeadersReceived.addListener((event) => {
        event.responseHeaders = event.responseHeaders
            ?.filter(header => header.name.toLowerCase() !== 'content-security-policy')
        event.responseHeaders?.push({
            name: "Content-Security-Policy",
            value: "script-src 'self' http://localhost:*; object-src 'self';",
        });
        return {responseHeaders: event.responseHeaders};
    }, {urls: [urlFilter]}, ["blocking", "responseHeaders"]);
}