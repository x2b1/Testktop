/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { session } from "electron";

import { Settings } from "../settings";

const DEFAULT_BLOCKLIST = [
    "https://*/api/v*/science",
    "https://*/api/v*/applications/detectable",
    "https://*/api/v*/auth/location-metadata",
    "https://*/api/v*/premium-marketing",
    "https://*/api/v*/scheduled-maintenances/upcoming.json",
    "https://*/error-reporting-proxy/*",
    "https://cdn.discordapp.com/bad-domains/*",
    "https://www.youtube.com/youtubei/v*/next?*",
    "https://www.youtube.com/s/desktop/*",
    "https://www.youtube.com/youtubei/v*/log_event?*"
];

const DEFAULT_BLOCKED_STRINGS = [
    "sentry",
    "google",
    "tracking",
    "stats",
    "\\.spotify",
    "pagead",
    "analytics",
    "doubleclick"
];
const DEFAULT_ALLOWED_STRINGS = [
    "videoplayback",
    "discord-attachments",
    "googleapis",
    "search",
    "api.spotify",
    "discord.com/assets/sentry."
];

function getOrDefault<T>(key: keyof typeof Settings.store, def: T): T {
    const v = Settings.store[key as any];
    return (v as T) ?? def;
}

export function initFirewall() {
    // default to true if undefined (privacy by default)
    const enabled = Settings.store.firewall ?? true;
    if (!enabled) {
        console.log("[Tesktop Firewall] Disabled via settings");
        return;
    }

    const useCustom = Settings.store.customFirewallRules ?? false;
    const blocklist = useCustom ? getOrDefault("blocklist", DEFAULT_BLOCKLIST) : DEFAULT_BLOCKLIST;
    const blockedStrings = useCustom
        ? getOrDefault("blockedStrings", DEFAULT_BLOCKED_STRINGS)
        : DEFAULT_BLOCKED_STRINGS;
    const allowedStrings = useCustom
        ? getOrDefault("allowedStrings", DEFAULT_ALLOWED_STRINGS)
        : DEFAULT_ALLOWED_STRINGS;

    if (blocklist[0] !== "" && blocklist.length) {
        session.defaultSession.webRequest.onBeforeRequest({ urls: blocklist }, (_, callback) =>
            callback({ cancel: true })
        );
    }

    const blockRegex = new RegExp(blockedStrings.join("|"), "i");
    const allowRegex = new RegExp(allowedStrings.join("|"), "i");

    session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ["<all_urls>"] }, (details, callback) => {
        if (details.resourceType !== "xhr") return callback({ cancel: false });
        if (blockRegex.test(details.url) && !allowRegex.test(details.url)) {
            return callback({ cancel: true });
        }
        callback({ cancel: false });
    });

    console.log("[Tesktop Firewall] Initialized — blocking telemetry & tracking");
}

export function unstrictCSP() {
    session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders, resourceType }, done) => {
        if (!responseHeaders) return done({});
        if (resourceType === "mainFrame" || resourceType === "subFrame") {
            responseHeaders["content-security-policy"] = [""];
        } else if (resourceType === "stylesheet") {
            responseHeaders["content-type"] = ["text/css"];
        }
        done({ responseHeaders });
    });
    console.log("[Tesktop Firewall] CSP relaxed for custom assets");
}

export function initProxy() {
    const enabled = Settings.store.proxyEnabled ?? false;
    if (!enabled) return;

    const rules = Settings.store.proxyRules || "127.0.0.1:8080";
    const bypass = Settings.store.proxyBypassRules || "<local>";

    session.defaultSession.setProxy({ proxyRules: rules, proxyBypassRules: bypass }).then(() => {
        console.log(`[Tesktop Proxy] Enabled → ${rules} (bypass: ${bypass})`);
    });
}
