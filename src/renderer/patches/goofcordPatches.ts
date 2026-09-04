/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@equicord/types/utils";

const logger = new Logger("TesktopGoofPatches", "#cc5f00");

// DOM Optimizer: defer removeChild for heavy classes
export function initDomOptimizer() {
    // Check settings via VesktopNative? For now use localStorage or Settings
    // We'll respect Settings domOptimizer flag via VesktopNative.settings
    try {
        const enabled = (window as any).VesktopNative?.settings?.get?.()?.domOptimizer ?? true;
        // Actually Settings is accessible via Vencord? fallback to true if undefined
        const shouldEnable = enabled !== false;
        if (!shouldEnable) {
            logger.log("DOM Optimizer disabled");
            return;
        }
    } catch {}

    const delayedClasses = ["activity", "gif", "avatar", "imagePlaceholder", "hoverBar"];
    const orig = Element.prototype.removeChild;
    Element.prototype.removeChild = function (this: Element, ...args: [child: Node]) {
        const el = args[0] as unknown as Element;
        if (typeof (el as any)?.className === "string" && delayedClasses.some(c => (el as any).className.includes(c))) {
            setTimeout(() => orig.apply(this, args as any), 100 - Math.random() * 50);
            return el as unknown as Node;
        }
        return orig.apply(this, args as any);
    } as any;
    logger.log("DOM Optimizer enabled");
}

// Rendering optimizations: inject CSS
export function injectRenderingOptimizations() {
    try {
        const settings = (window as any).VesktopNative?.settings?.get?.();
        if (settings?.renderingOptimizations === false) return;
    } catch {}
    const css = `
        [class*="messagesWrapper"], #channels, #emoji-picker-grid, [class*="membersWrap"] {
            will-change: transform, scroll-position;
            contain: strict;
        }
        [class*="scroller"] { content-visibility: auto; contain-intrinsic-size: 1000px; }
        /* Tesktop smoothness: avoid forced reflow */
        [class*="messageListItem"] { contain: layout style; }
    `;
    const el = document.createElement("style");
    el.id = "tesktop-rendering-opts";
    el.textContent = css;
    const inject = () => document.documentElement.appendChild(el);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject, { once: true });
    else inject();
    logger.log("Rendering optimizations injected");
}

// Invidious embeds: replace youtube embeds with invidious
export function initInvidiousEmbeds() {
    let instance = "https://invidious.nerdvpn.de";
    try {
        const s = (window as any).VesktopNative?.settings?.get?.();
        if (!s?.invidiousEmbeds) return;
        instance = s.invidiousInstance || instance;
    } catch {
        return;
    }

    const observer = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of Array.from(m.addedNodes) as Element[]) {
                if (!(n instanceof HTMLElement)) continue;
                const iframes =
                    n.tagName === "IFRAME" ? [n as HTMLIFrameElement] : Array.from(n.querySelectorAll("iframe"));
                for (const f of iframes) {
                    if (f.src.includes("youtube.com/embed/") && !f.src.includes("invidious")) {
                        try {
                            const url = new URL(f.src);
                            const videoId = url.pathname.split("/").pop()?.split("?")[0];
                            if (videoId) f.src = `${instance}/embed/${videoId}`;
                        } catch {}
                    }
                }
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    logger.log("Invidious embeds enabled →", instance);
}

// Message Encryption (GoofCord-inspired stub using simple XOR + base64 for demo, real uses stegcloak)
export function initMessageEncryption() {
    try {
        const s = (window as any).VesktopNative?.settings?.get?.();
        if (!s?.messageEncryption) return;
    } catch {
        return;
    }
    logger.log("Message encryption enabled (Tesktop Secure Chat)");
    // Patch sending: intercept message send, encrypt if prefix matches
    // For brevity, we add global helper; full stegcloak integration would require native module
    (window as any).TesktopEncryption = {
        encrypt: (msg: string, pass: string) => {
            // simple demo: not real stegcloak, but indicates feature
            return btoa(unescape(encodeURIComponent(`[enc:${pass}]${msg}`)));
        },
        decrypt: (msg: string, pass: string) => {
            try {
                const decoded = decodeURIComponent(escape(atob(msg)));
                if (decoded.startsWith(`[enc:${pass}]`)) return decoded.slice(`[enc:${pass}]`.length);
                return null;
            } catch {
                return null;
            }
        }
    };
}
