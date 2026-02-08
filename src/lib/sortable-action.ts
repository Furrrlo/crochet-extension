import Sortable, {type SortableEvent} from "sortablejs";
import type {ActionReturn} from "svelte/action";

const HANDLE_ATTR = 'data-sortable-handle';

export function sortableHandle(node: HTMLElement) {
    node.setAttribute(HANDLE_ATTR, 'true');
    node.style.cursor = 'grabbing';
    return {};
}

export function sortable<T>(node: HTMLElement, {items, onEnd, handle, ...options}: {
    handle?: boolean | string,
    items: T[];
    onEnd: (evt: SortableEvent, newItems: T[]) => void,
} & Omit<Sortable.Options, 'onEnd' | 'handle'>): ActionReturn {
    const sortable = Sortable.create(node, {
        ...options,
        handle: typeof handle === 'string'
            ? handle
            : handle
                ? `[${HANDLE_ATTR}]`
                : undefined,
        onEnd: (evt) => {
            const {oldIndex, newIndex} = evt;
            if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

            // Clone the current state and reorder
            const newItems = [...items];
            const [movedItem] = newItems.splice(oldIndex, 1);
            newItems.splice(newIndex, 0, movedItem);

            onEnd(evt, newItems);
        }
    });

    return {
        destroy() {
            sortable.destroy();
        }
    };
}