import browser from "webextension-polyfill";

if (document.body) {
    new MutationObserver(mutations => mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType !== node.ELEMENT_NODE)
                return;

            const element = node as Element
            if (element.id !== "movie_player")
                return;

            const controls = element.querySelector(".ytp-right-controls")
            if (!controls)
                return;

            const btn = createPlayerBtn('Create crochet project');
            btn.style.opacity = "0.85"
            btn.appendChild((() => {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute('stroke-width', "2");
                svg.setAttribute('stroke-linecap', "round");
                svg.setAttribute('stroke-linejoin', "round");
                svg.classList.add("lucide", "lucide-spool-icon", "lucide-spool");
                svg.appendChild((() => {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", "M17 13.44 4.442 17.082A2 2 0 0 0 4.982 21H19a2 2 0 0 0 .558-3.921l-1.115-.32A2 2 0 0 1 17 14.837V7.66");
                    return path;
                })());
                svg.appendChild((() => {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", "m7 10.56 12.558-3.642A2 2 0 0 0 19.018 3H5a2 2 0 0 0-.558 3.921l1.115.32A2 2 0 0 1 7 9.163v7.178");
                    return path;
                })());
                return svg;
            })());
            btn.onclick = () => browser.runtime.sendMessage({
                type: 'crochet-create-yt-project',
                href: window.location.href,
            });
            controls.insertBefore(btn, controls.childNodes[0]);
        })
    })).observe(document.body, {
        subtree: true,
        childList: true,
    })
}

function createPlayerBtn(title: string) {
    // https://github.com/code-charity/youtube/blob/6ab3e783a7feafddc53a61f2e0a7204596f949ec/js%26css/web-accessible/functions.js#L675
    const button = document.createElement('button');
    button.className = 'ytp-button it-player-button';
    button.dataset['title'] = title;
    button.style.opacity = .5.toString();

    button.addEventListener('mouseover', function () {
        const button = this;
        const tooltip = document.createElement('div');
        const rect = button.getBoundingClientRect();

        tooltip.className = 'it-player-button--tooltip';
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - 8 + 'px';
        tooltip.textContent = button.dataset['title'] ?? '';

        function mouseleave() {
            tooltip.remove();
            button.removeEventListener('mouseleave', mouseleave);
        }

        button.addEventListener('mouseleave', mouseleave);
        document.body.appendChild(tooltip);
    });

    return button;
}