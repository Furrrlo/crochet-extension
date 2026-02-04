<script context="module" lang="ts">
    import type {HTMLInputAttributes, HTMLInputTypeAttribute} from "svelte/elements";

    type ExtractKeysOfType<T, K extends keyof T, TP> = T[K] extends TP ? K : never
    type ExcludeKeysOfType<T, K extends keyof T, TP> = T[K] extends TP ? never : K

    export type Hints<T> = T extends never ? any : ({
        [K in keyof T as ExtractKeysOfType<Required<T>, K, any[]>]-?: Required<T>[K] extends (infer U)[]
            ? HintsWithKey<U>
            : never
    } & {
        [K in keyof T as ExcludeKeysOfType<Required<T>, K, any[]>]+?: NonNullable<T[K]> extends (string | number | boolean)
            ? PrimitiveHint
            : (Hints<NonNullable<T[K]>>)
    });

    export type HintsWithKey<T> = T extends never ? any : {
        [K in keyof T]: NonNullable<T[K]> extends string
            ? Omit<Hints<T>, K> & { [P in K]: IdHint<T> }
            : never
    }[keyof T];

    HTMLInputElement
    export type PrimitiveHint = Pick<HTMLInputAttributes,
        "max" | "maxlength" | "min" | "minlength" | "pattern" | "placeholder" | "step"
    > & {
        type?: HTMLInputTypeAttribute | 'textarea',
        render?: string | Snippet,
    }

    export type IdHint<T> = {
        type: 'id',
        render?: Snippet<[{
            local?: T,
            incoming?: T,
        }]>
    }

    export type Props<T> = {
        localValues: T[],
        incomingValues: T[],
        hints: HintsWithKey<T>,
        onClose: (res: { merged: T[], local: T[], incoming: T[] }) => void,
    }
</script>

<script lang="ts" generics="T">
    import {FontAwesomeIcon} from "@fortawesome/svelte-fontawesome";
    import {type Snippet} from "svelte";

    let {localValues, incomingValues, hints, onClose}: Props<T> = $props()

    type ConflictTree = {
        segment: string,
        local: any;
        incoming: any;
        current: any;
    } & ({
        children?: undefined;
        hint?: {
            type?: HTMLInputTypeAttribute | 'textarea',
            render?: string | Snippet
        };
    } | {
        children: ConflictTree[],
        hint?: {
            render?: Snippet<[{
                local?: any,
                incoming?: any,
            }]>
        };
    })

    let mergedValues = $state<T[] | undefined>();
    const [initMergedValues, conflicts] = $derived.by(() => {
        function merge<T extends Record<any, any>>(
            segment: string,
            hints: Hints<T> | undefined,
            localVal: T | undefined,
            inVal: T | undefined,
            currRef: { v: T | undefined },
        ): ConflictTree[] {
            const setCurr = (v: T | undefined) => {
                currRef.v = v;
                return [];
            };
            if (!localVal) return setCurr(inVal);
            if (!inVal) setCurr(localVal);

            if (Array.isArray(localVal) || Array.isArray(inVal)) {
                return mergeArray<any, any>(segment, hints, localVal, inVal, currRef);
            }

            if (typeof localVal !== 'object' && typeof inVal !== 'object') {
                const typeHint = (() => {
                    if (hints?.type) return hints.type;

                    const type = typeof localVal !== "undefined" && typeof localVal !== "object" // 'object' for nulls
                        ? typeof localVal
                        : typeof inVal;
                    switch (type) {
                        case "number":
                        case "bigint":
                            return "number";
                        case "boolean":
                            return "checkbox";
                        default:
                            return "text";
                    }
                })();
                return localVal === inVal ? setCurr(localVal) : [{
                    segment: segment,
                    hint: {...hints, type: typeHint},
                    local: localVal,
                    incoming: inVal,
                    get current() {
                        return currRef.v;
                    },
                    set current(v) {
                        currRef.v = v;
                    },
                }];
            }

            return mergeObject(segment, hints, localVal, inVal, currRef);
        }

        function mergeObject<T extends Record<any, any>>(
            segment: string,
            hints: Hints<T> | undefined,
            localVal: T | undefined,
            inVal: T | undefined,
            currRef: { v: T | undefined },
        ): ReturnType<typeof merge<T>> {
            currRef.v = {} as T;
            return [...new Set([
                ...Object.keys(localVal ?? {}),
                ...Object.keys(inVal ?? {}),
            ])].flatMap(prop => merge(prop, hints?.[prop], localVal?.[prop], inVal?.[prop], {
                get v() {
                    return currRef.v?.[prop];
                },
                set v(v) {
                    (currRef.v as Record<any, any>)[prop] = v;
                }
            }).map(c => {
                if (segment !== '')
                    c.segment = `${segment}.${c.segment}`;
                return c;
            }) ?? [])
        }

        function mergeArray<U extends Record<any, any>, T extends (U | undefined)[]>(
            segment: string,
            hints: Hints<U> | undefined,
            localVal: T | undefined,
            inVal: T | undefined,
            currRef: { v: T | undefined },
        ): ReturnType<typeof merge<U[]>> {
            const [idHint, idProp]: [
                    IdHint<T> | undefined,
                    string | undefined,
            ] = Object.entries<any>(hints ?? {}).map(([k, v]) =>
                v?.type === 'id'
                    ? [v, k] satisfies [IdHint<U>, string]
                    : undefined
            ).find(k => k !== undefined) ?? [undefined, undefined]
            if (idProp === undefined || idHint === undefined) throw `missing id in hints`;

            const localValuesById = new Map<string, U | undefined>(localVal?.map(i => [i?.[idProp], i]));
            const incomingValuesById = new Map<string, U | undefined>(inVal?.map(i => [i?.[idProp], i]));

            currRef.v = [] as unknown as T;
            return [...new Set([
                ...localValuesById.keys(),
                ...incomingValuesById.keys(),
            ])].map((id, idx) => {
                const localVal = localValuesById.get(id);
                const incomingVal = incomingValuesById.get(id);

                const currIdxRef: { v: U | undefined } = {
                    get v() {
                        return currRef.v?.[idx];
                    },
                    set v(v) {
                        currRef.v![idx] = v;
                    }
                };

                const conflicts = merge<U>('', hints, localVal, incomingVal, currIdxRef);
                return conflicts.length <= 0 ? undefined : {
                    segment: segment !== '' ? `${segment}[${id}]` : id,
                    children: conflicts,
                    hint: {render: idHint.render},
                    local: localVal,
                    incoming: incomingVal,
                    current: currIdxRef,
                } satisfies ConflictTree;
            }).filter(c => c !== undefined);
        }

        let isInDerive = true;
        let initMergedValues: T[] | undefined;
        const conflicts = merge<any>("", hints, localValues, incomingValues, {
            get v() {
                return isInDerive ? initMergedValues : mergedValues;
            },
            set v(v) {
                if (isInDerive) {
                    initMergedValues = v;
                } else {
                    mergedValues = v;
                }
            }
        });
        isInDerive = false;
        return [initMergedValues, conflicts]
    });

    let currentIndex = $state(conflicts.length > 0 ? 0 : undefined);
    $effect.pre(() => {
        mergedValues = initMergedValues;
        currentIndex = conflicts.length > 0 ? 0 : undefined;
    });

    let dialogRef: HTMLDialogElement;

    export function dialog() {
        return dialogRef;
    }

    const onAllCurrent = () => doMerge(localValues);
    const onAllIncoming = () => doMerge(incomingValues);
    const onFinalize = () => doMerge($state.snapshot(mergedValues) as T[]);
    $effect.pre(() => {
        if (conflicts.length <= 0)
            onFinalize();
    });

    function doMerge(values: T[] | undefined) {
        if (!values)
            return

        onClose({merged: values, local: localValues, incoming: incomingValues});
    }
</script>

<dialog class="modal" bind:this={dialogRef}>
    <div class="modal-box max-w-4xl bg-base-100 p-0 overflow-hidden border border-base-300 shadow-2xl">

        <div class="bg-base-200 px-6 py-4 border-b border-base-300">
            <div class="flex justify-between items-center">
                <div class="flex flex-col">
                    <h3 class="font-bold text-lg">Resolving Conflicts</h3>
                    <span class="text-xs opacity-50 uppercase font-bold tracking-widest">
                        Conflict {currentIndex !== undefined ? currentIndex + 1 : '0'} of {conflicts.length}
                    </span>
                </div>

                <progress class="progress progress-primary w-32"
                          value={currentIndex !== undefined ? currentIndex / conflicts.length * 100 : 100}
                          max="100">
                </progress>
            </div>

            <div class="flex gap-3 mt-4">
                <button class="btn btn-primary btn-sm flex-1" onclick={onAllCurrent}>Accept All Current</button>
                <button class="btn btn-success btn-sm flex-1" onclick={onAllIncoming}>Accept All Incoming</button>
            </div>
        </div>

        <div class="p-5 h-100 max-h-dvh flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            <div class="flex items-center justify-center gap-2">
                {#if currentIndex !== undefined}
                    {@const currConflict = conflicts[currentIndex]}
                    {#if currConflict.children && currConflict.hint?.render !== undefined}
                        {@render currConflict.hint.render({
                            local: currConflict.local,
                            incoming: currConflict.incoming,
                        })}
                    {:else}
                        <div class="badge badge-outline badge-md">Conflict</div>
                        <h2 class="text-xl font-black line-clamp-1 text-ellipsis">
                            "{conflicts[currentIndex].segment}"
                        </h2>
                    {/if}
                {/if}
            </div>

            {#snippet renderConflict(conflict: ConflictTree, depth = 0)}
                {#if !conflict.children}
                    <p class="text-center text-sm {depth !== 0 ? 'opacity-50' : ''} mb-1">
                        {#if typeof conflict.hint?.render === 'string'}
                            {conflict.hint.render}:
                        {:else if conflict.hint?.render !== undefined}
                            {@render conflict.hint.render()}
                        {:else}
                            {conflict.segment}:
                        {/if}
                    </p>
                    <div class="grid grid-cols-3 gap-4 items-center">
                        <button class="btn {depth === 0 ? 'btn-md' : 'btn-sm'} btn-outline btn-error text-center relative group"
                                onclick="{() => conflict.current = conflict.local}">
                            <span class="text-xs absolute -top-2 left-2 bg-base-100 px-1 text-error">Current</span>
                            <p class="text-sm font-medium">{conflict.local}</p>
                        </button>

                        {#if conflict.hint?.type === "textarea"}
                            <!-- TODO: -->
                        {:else}
                            <input type={conflict.hint?.type ?? 'text'}
                                   bind:value={
                                       () => conflict.current,
                                       (v) => conflict.current = v}
                                   class="input {depth === 0 ? 'input-md' : 'input-sm'} input-bordered join-item w-full text-center font-bold focus:input-primary"
                            />
                        {/if}

                        <button class="btn {depth === 0 ? 'btn-md' : 'btn-sm'} btn-outline btn-success text-center relative"
                                onclick="{() => conflict.current = conflict.incoming}">
                            <span class="text-xs absolute -top-2 right-2 bg-base-100 px-1 text-success">Incoming</span>
                            <p class="text-sm font-medium">{conflict.incoming}</p>
                        </button>
                    </div>
                {:else}
                    <div class="p-4 rounded-xl bg-base-200/50 border border-dashed border-base-300 space-y-4">
                        <div class="flex items-center justify-center gap-2 text-xs font-bold opacity-50">
                            {#if conflict.hint?.render !== undefined}
                                {@render conflict.hint.render({
                                    local: conflict.local,
                                    incoming: conflict.incoming,
                                })}
                            {:else}
                                <div class="badge badge-outline badge-sm">Conflict</div>
                                <span class="line-clamp-1 text-ellipsis">"{conflict.segment}"</span>
                            {/if}
                        </div>

                        {#each conflict.children as child}
                            {@render renderConflict(child, depth + 1)}
                        {/each}
                    </div>
                {/if}
            {/snippet}

            {#if currentIndex !== undefined}
                {#each conflicts[currentIndex].children as conflict}
                    {@render renderConflict(conflict)}
                {/each}
            {/if}
        </div>

        <div class="bg-base-200 p-4 border-t border-base-300 flex justify-between">
            <button class="btn btn-ghost gap-2"
                    disabled={currentIndex === undefined || currentIndex === 0}
                    onclick={() => { if(currentIndex !== undefined) currentIndex--; }}>
                <FontAwesomeIcon icon="fa-solid fa-chevron-left"/>
                Previous
            </button>

            <div class="flex gap-2">
                <!--<button class="btn btn-outline">Skip</button>-->
                {#if currentIndex !== undefined && currentIndex < conflicts.length - 1}
                    <button class="btn btn-primary gap-2"
                            onclick={() => { if(currentIndex !== undefined) currentIndex++; }}>
                        Next Conflict
                        <FontAwesomeIcon icon="fa-solid fa-chevron-right"/>
                    </button>
                {:else}
                    <button class="btn btn-primary gap-2" onclick={onFinalize}>
                        <FontAwesomeIcon icon="fa-solid fa-file-import"/>
                        Finalize Merge
                    </button>
                {/if}
            </div>
        </div>
    </div>
</dialog>