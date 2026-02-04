import {defineConfig} from "vite";
import {svelte} from "@sveltejs/vite-plugin-svelte";
import webExtension, {readJsonFile} from "vite-plugin-web-extension";
import tailwindcss from "@tailwindcss/vite";
import {nodePolyfills} from 'vite-plugin-node-polyfills'
import {fileURLToPath, URL} from 'node:url'
import {
    Launcher as ChromeLauncher,
} from 'chrome-launcher';
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {resolve as resolvePath} from "node:path";

const publicChromeKey = resolvePath("./chrome-public-key");
const privateChromeKey = resolvePath('./chrome-private-key.pem')

function generateManifest() {
    const manifest = readJsonFile("src/manifest.json");
    const pkg = readJsonFile("package.json");

    return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        key: pkg.key,
        ...(existsSync(publicChromeKey) ? {
            '{{chrome}}.key': readFileSync(publicChromeKey, {encoding: "utf-8"}).trimEnd(),
        } : {}),
        ...manifest,
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
        webExtension({
            manifest: generateManifest,
            browser: process.env.TARGET || "chrome",
            watchFilePaths: ["package.json", "manifest.json"],
            additionalInputs: ["src/index.html"],
            onBundleReady: () => {
                const browser = process.env.TARGET || "chrome";
                if (browser !== "chrome") {
                    return;
                }

                const installation = ChromeLauncher.getFirstInstallation()
                if (!installation) {
                    console.warn("Couldn't find default chrome installation");
                    return;
                }

                if (existsSync(privateChromeKey)) {
                    console.log("Packing chrome extension...")
                    execFileSync(installation, [
                        '--pack-extension=' + resolvePath("./dist/"),
                        '--pack-extension-key=' + privateChromeKey,
                    ], {stdio: 'pipe'});
                }
            }
        }),
        // for the gapi node library
        nodePolyfills({
            include: ['stream', 'fs', "http2"],
            globals: {process: true},
            overrides: {
                'fs': fileURLToPath(new URL('./src/mock/fs.mock.ts', import.meta.url)),
                'http2': fileURLToPath(new URL('./src/mock/http2.mock.ts', import.meta.url)),
            }
        }),
    ],
    resolve: {
        alias: {
            'node:stream/web': 'stream-browserify',
            'node-fetch': fileURLToPath(new URL('./src/mock/fetch.mock.ts', import.meta.url)),
        },
    },
});
