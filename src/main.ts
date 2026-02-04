import {mount} from "svelte";

import {library} from '@fortawesome/fontawesome-svg-core'
import {fas} from '@fortawesome/free-solid-svg-icons'
import {far} from '@fortawesome/free-regular-svg-icons'
import {fab} from '@fortawesome/free-brands-svg-icons'
import App from "./pages/App.svelte";

library.add(far, fas, fab)

mount(App, {target: document.body});
