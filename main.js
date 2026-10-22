(() => {
    "use strict";

    const rates = new Map([
        ["Numpad0", 1], ["Numpad1", 0.25], ["Numpad2", 0.5],
        ["Numpad3", 0.75], ["Numpad4", 1.25], ["Numpad5", 1.5],
        ["Numpad6", 2], ["Numpad7", 3], ["Numpad8", 4], ["Numpad9", 5],
    ]);
    const heldCodes = new Set(["Numpad7", "Numpad8", "Numpad9", "NumpadSubtract"]);
    const commands = new Set([...rates.keys(), "NumpadSubtract", "NumpadDecimal", "NumpadMultiply", "NumpadDivide"]);
    const altCommands = new Map([
        ...Array.from({ length: 10 }, (_, digit) => [`Digit${digit}`, `Numpad${digit}`]),
        ["Minus", "NumpadSubtract"], ["Period", "NumpadDecimal"], ["Slash", "NumpadDivide"],
    ]);
    const history = new WeakMap();
    const pressed = new Set();
    let temporary = null;

    function activeVideo() {
        return [...document.querySelectorAll("video")]
            .map(video => ({ video, rect: video.getBoundingClientRect(), style: getComputedStyle(video) }))
            .filter(({ video, rect, style }) => video.isConnected && rect.width > 0 && rect.height > 0 &&
                rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth &&
                style.visibility !== "hidden" && style.display !== "none")
            .sort((a, b) => Number(!b.video.paused) - Number(!a.video.paused) ||
                b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0]?.video;
    }

    function speedState(video) {
        if (!history.has(video)) {
            const state = { current: video.playbackRate, previous: video.playbackRate };
            history.set(video, state);
            video.addEventListener("ratechange", () => syncSpeed(video));
        }
        return syncSpeed(video);
    }

    function syncSpeed(video) {
        const state = history.get(video);
        if (state && temporary?.video !== video && state.current !== video.playbackRate) {
            state.previous = state.current;
            state.current = video.playbackRate;
        }
        return state;
    }

    function setSpeed(video, rate) {
        try {
            video.playbackRate = rate;
            return true;
        } catch {
            return false; // Some media types or browsers reject particular speeds.
        }
    }

    function finishTemporary(resume = true) {
        if (!temporary) return;
        const effect = temporary;
        clearInterval(effect.timer);
        setSpeed(effect.video, effect.rate);
        temporary = null;
        if (effect.command === "NumpadSubtract" && effect.wasPlaying && resume &&
            effect.video.isConnected && effect.source === effect.video.currentSrc) {
            const playback = effect.video.play();
            playback?.catch(() => {});
        }
    }

    function reset(resume = true) {
        finishTemporary(resume);
        pressed.clear();
    }

    function rewind() {
        const effect = temporary;
        if (!effect) return;
        const video = effect.video;
        if (!video.isConnected || effect.source !== video.currentSrc) {
            reset(false);
            return;
        }
        const now = performance.now();
        const target = video.currentTime - (now - effect.lastTime) / 1000 * effect.rate;
        effect.lastTime = now;
        for (let i = video.seekable.length - 1; i >= 0; i--) {
            const start = video.seekable.start(i);
            const end = video.seekable.end(i);
            if (target >= start || i === 0) {
                try {
                    video.currentTime = Math.max(start, Math.min(end, target));
                } catch {
                    reset();
                }
                break;
            }
        }
    }

    function isEditable(event) {
        return event.composedPath().some(element => element.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) ||
            element.getAttribute?.("role") === "textbox");
    }

    document.addEventListener("keydown", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing ||
            event.getModifierState?.("AltGraph") || isEditable(event)) return;
        const command = event.altKey ? altCommands.get(event.code) :
            (commands.has(event.code) ? event.code : undefined);
        if (!command) return;
        const video = activeVideo();
        if (!video) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat || pressed.has(event.code)) return;
        pressed.add(event.code);
        if (temporary && (temporary.video !== video || temporary.source !== video.currentSrc)) {
            finishTemporary(false);
        }
        if (temporary && heldCodes.has(command)) return;
        finishTemporary();
        const state = speedState(video);

        if (heldCodes.has(command)) {
            temporary = {
                video, code: event.code, command, requiresAlt: Boolean(event.altKey), rate: video.playbackRate,
                wasPlaying: !video.paused, source: video.currentSrc, lastTime: performance.now(),
            };
            if (command === "NumpadSubtract") {
                video.pause();
                temporary.timer = setInterval(rewind, 50);
            } else if (!setSpeed(video, rates.get(command))) {
                finishTemporary();
            }
        } else if (rates.has(command) || command === "NumpadDecimal") {
            const rate = rates.get(command) ?? state.previous;
            if (setSpeed(video, rate)) syncSpeed(video);
        } else if (command === "NumpadDivide") {
            if (Number.isFinite(video.duration) && video.duration > 0) {
                try { video.currentTime = video.duration; } catch { /* Media may not be seekable yet. */ }
            }
        }
        // Multiply refreshes selection; every command also resolves the current video.
    }, true);

    document.addEventListener("keyup", event => {
        if ((event.code === "AltLeft" || event.code === "AltRight") && !event.altKey) {
            let handled = false;
            for (const code of pressed) {
                if (altCommands.has(code)) {
                    pressed.delete(code);
                    handled = true;
                }
            }
            if (temporary?.requiresAlt) finishTemporary();
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }
        if (!pressed.delete(event.code)) return;
        event.preventDefault();
        event.stopPropagation();
        if (temporary?.code === event.code) finishTemporary();
    }, true);
    window.addEventListener("blur", () => reset());
    window.addEventListener("pagehide", () => reset(false));
    window.addEventListener("popstate", () => reset(false));
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) reset();
    });
    document.addEventListener("yt-navigate-start", () => reset(false));
    document.addEventListener("emptied", event => {
        if (temporary?.video === event.target) reset(false);
    }, true);
    new MutationObserver(() => {
        if (temporary && !temporary.video.isConnected) reset(false);
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
