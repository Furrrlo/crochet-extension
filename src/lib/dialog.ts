import {type Component, mount, onMount, settled, tick, unmount} from "svelte";

export function createDialog<
    T,
    Props extends (Record<string, any> & {
        onClose: (value: T) => void
    }),
    Exports extends Record<string, any>,
>(component: Component<Props, Exports>, {target, props, onMount: onMnt}: {
      target?: Document | Element | ShadowRoot,
      onMount?: (v: Exports) => void,
  } & ({} extends Props
      ? { props?: Omit<Props, 'onClose'> }
      : { props: Omit<Props, 'onClose'> })
) {
    let close: (value: T | PromiseLike<T> | undefined) => void;
    const promise = new Promise<T | undefined>((resolve) => {
        close = resolve;
    });

    // Let's try capturing the mf moment it gets mounted
    const newDiv = document.createElement("div");
    (target ?? document.body).appendChild(newDiv);
    new MutationObserver((_, obs) => {
        try {
            const dialogs = newDiv.querySelectorAll('dialog');
            if (dialogs.length === 1) {
                const dialog = dialogs[0];
                dialog.addEventListener('toggle', () => {
                    if (!dialog.open)
                        close(undefined);
                });
            }

            if (onMnt)
                settled().then(() => onMnt(mounted))
        } finally {
            obs.disconnect();
        }
    }).observe(newDiv, {childList: true})

    const mounted = mount(component, {
        target: newDiv,
        props: {
            ...props,
            onClose: close!,
        } as Props,
    });

    return promise.finally(() => unmount(mounted));
}
