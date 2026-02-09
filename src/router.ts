import {
    blockNavigation,
    createRouter,
    type Hooks, type Path,
    serializeSearch
} from 'sv-router';
import Videos from "./pages/Videos.svelte";
import NotFound from "./pages/NotFound.svelte";

// Force navigation to respect beforeunload event listeners
const beforeUnloadHook = ((): Hooks => {
    let justAllowed = false;
    const blockNavigationCallback = () => {
        const cancelled = !window.dispatchEvent(new Event('beforeunload', {cancelable: true}));
        if (cancelled && !window.confirm("Le modifiche apportate potrebbero non essere salvate.")) {
            return false;
        }

        justAllowed = true;
        return true;
    };

    blockNavigation(blockNavigationCallback)
    return {
        beforeLoad: () => {
            if (justAllowed) {
                blockNavigation(blockNavigationCallback)
                justAllowed = false;
            }
        }
    }
})()

const routes = {
    '/': Videos,
    '/add': Videos,
    '/add/:nv': Videos,
    '/settings': Videos,
    '/video/:video': Videos,
    '/video/:video/add': Videos,
    '/video/:video/add/:nv': Videos,
    '/video/:video/settings': Videos,
    '*': NotFound,
    hooks: beforeUnloadHook,
};
const router = createRouter(routes);

export type Routes = typeof routes;
export type PickRoute<T, Path extends string> = Extract<T, [Path, ...any[]]>;
export type ExcludeRoute<T, Path extends string> = Exclude<T, [Path, ...any[]]>;

export const {navigate, isActive, route} = router;

// Fix p to work with hash-based routing and search params
export function p<U extends Path<Routes>>(...args: Parameters<typeof router.p<U>>): ReturnType<typeof router.p<U>> {
    const [path, options] = args;

    const p = router.p as (p: typeof path, o: typeof options) => ReturnType<typeof router.p<U>>;
    if (options?.search !== undefined) {
        let res = p(path, {...options, search: undefined});
        return serializeSearch(options.search) + res;
    }

    return p(path, options)
}