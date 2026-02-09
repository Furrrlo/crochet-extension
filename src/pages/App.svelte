<script lang="ts">
    import {Router} from 'sv-router';
    import '../router.ts';
    import {initStoreContext} from "../lib/extLocalStore.svelte";

    initStoreContext();
</script>

<Router base="#"/>
