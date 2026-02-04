import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  compilerOptions: {
      // disable all warnings coming from node_modules and all accessibility warnings
      warningFilter: (warning) => warning.code === 'a11y_invalid_attribute',
  }
}
