import browser from "webextension-polyfill";
import {youtube} from "@googleapis/youtube/index";

export const GAPI_STORAGE_KEY = "gapi_key"
export function googleApi() {
    return browser.storage.local.get(GAPI_STORAGE_KEY).then((values) => {
        const gapiKey = values[GAPI_STORAGE_KEY]
        if (!gapiKey)
            throw "missing gapi key"

        return {
            youtube: () => youtube({
                version: "v3",
                auth: gapiKey,
            })
        }
    })
}