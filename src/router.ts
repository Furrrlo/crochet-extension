import {blockNavigation, createRouter, type Hooks} from 'sv-router';
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

const router = createRouter({
    '/': Videos,
    '/add': Videos,
    '/add/:nv': Videos,
    '/settings': Videos,
    '*': NotFound,
    hooks: beforeUnloadHook,
});

export const {p, navigate, isActive, route} = router;