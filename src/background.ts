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

function onExtensionResourceRequest({url, respondWith, type, event}: {
    url: string,
    type: WebRequest.ResourceType | RequestDestination,
    respondWith: (url: string, options?: { redirect?: boolean }) => void,
    event: any,
}) {
    if (type !== "document"
        || url.endsWith(".js")
        || url.endsWith(".ts")
        || url.endsWith(".css")
        || url.endsWith(".svelte"))
        return;

    if (url.endsWith("/src/options.html")) {
        respondWith(browser.runtime.getURL("/settings"), {redirect: true})
    } else {
        respondWith(browser.runtime.getURL("src/index.html"))
    }
}

addEventListener('fetch', async (event) => onExtensionResourceRequest({
    event,
    url: event.request.url,
    type: event.request.destination,
    respondWith: (url, opts) => event.respondWith(opts?.redirect
        ? Response.redirect(url)
        : fetch(url))
}))

if (browser.webRequest)
    browser.webRequest.onBeforeRequest.addListener((event) => {
        let redirectUrl: string | undefined;
        onExtensionResourceRequest({
            event,
            url: event.url,
            type: event.type,
            respondWith: (url) => redirectUrl = url,
        })
        return {redirectUrl: redirectUrl};
    }, {urls: ["<all_urls>"]}, ["blocking"])
