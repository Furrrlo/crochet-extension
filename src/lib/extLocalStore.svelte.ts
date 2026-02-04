import browser from "webextension-polyfill";
import {createContext} from "svelte";
import {SvelteMap} from "svelte/reactivity";

export class ExtLocalStore<T> {
    readonly key;
    readonly loaded;
    value = $state<T>() as T;

    constructor(key: string, value: T) {
        this.key = key;
        this.value = value;
        this.loaded = new Promise<void>(resolve =>
            browser.storage.local.get(this.key).then((items) => {
                const item = items[this.key]
                if (item) {
                    this.value = this.deserialize(item);
                }
                resolve()
            }))

        $effect(() => {
            browser.storage.local.set({
                [this.key]: this.serialize(this.value)
            })
        });
    }

    serialize(value: T): any {
        return typeof value == "object"
            ? JSON.stringify(value)
            : value;
    }

    deserialize(item: any): T {
        if (typeof item != "string")
            return item;

        // todo: string vs object
        try {
            return JSON.parse(item);
        } catch (e) {
            return item as T;
        }
    }
}

const [getStoreContext, setStoreContext] = createContext<{
    local: SvelteMap<string, ExtLocalStore<any>>,
}>();

export function initStoreContext() {
    setStoreContext({
        local: new SvelteMap(),
    });
}

export function extLocalStore<T>(key: string, value: T) {
    let context: ReturnType<typeof getStoreContext> | undefined;
    try {
        context = getStoreContext();
    } catch (err) {
        context = undefined;
    }

    if (context) {
        let v = context.local.get(key) as ExtLocalStore<T>;
        if (!v) {
            v = new ExtLocalStore(key, value);
            context.local.set(key, v);
        }
        return v;
    }

    return new ExtLocalStore(key, value);
}
