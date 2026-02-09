/// <reference types="serviceworker" />

import browser from "webextension-polyfill";

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
    return createOrActivateTab({newPath: "src/index.html"})
})

browser.runtime.onMessage.addListener(async (message) => {
    if (message.type !== 'crochet-create-yt-project')
        return

    const href = message.href as string;
    await createOrActivateTab({
        newPath: "src/index.html#/add/" + encodeURIComponent(href),
        replace: true,
    })
})