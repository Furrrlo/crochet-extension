import { createRouter } from 'sv-router';
import Videos from "./pages/Videos.svelte";
import NotFound from "./pages/NotFound.svelte";

export const { p, navigate, isActive, route } = createRouter({
    '/': Videos,
    '/add': Videos,
    '/add/:nv': Videos,
    '/settings': Videos,
    '*': NotFound,
});