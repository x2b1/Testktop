/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { release } from "node:os";

import { BrowserWindow } from "electron";

import { Settings } from "../settings";

interface Brand {
    brand: string;
    version: string;
}
interface UserAgentMetadata {
    brands: Brand[];
    fullVersionList: Brand[];
    platform: string;
    platformVersion: string;
    architecture: string;
    model: string;
    mobile: boolean;
    bitness: string;
    wow64: boolean;
}

function generateUA(platform: "win32" | "darwin" | "linux", major: string): string {
    const engine = "AppleWebKit/537.36 (KHTML, like Gecko)";
    const browser = `Chrome/${major}.0.0.0 Safari/537.36`;
    switch (platform) {
        case "win32":
            return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${engine} ${browser}`;
        case "darwin":
            return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${engine} ${browser}`;
        case "linux":
            return `Mozilla/5.0 (X11; Linux x86_64) ${engine} ${browser}`;
    }
}

function generateHints(
    platform: "win32" | "darwin" | "linux",
    arch: string,
    osVersion: string,
    chromeVersion: string
): UserAgentMetadata {
    const major = chromeVersion.split(".")[0];
    const brands = [
        { brand: "Chromium", version: major },
        { brand: "Google Chrome", version: major },
        { brand: "Not_A Brand", version: "99" }
    ];
    const fullVersionList = [
        { brand: "Chromium", version: chromeVersion },
        { brand: "Google Chrome", version: chromeVersion },
        { brand: "Not_A Brand", version: "99.0.0.0" }
    ];
    let pPlatform = "Unknown";
    let pVersion = osVersion;
    let pArch = "x86";
    if (platform === "win32") {
        pPlatform = "Windows";
        pVersion = "10.0.0";
    } else if (platform === "darwin") {
        pPlatform = "macOS";
        pArch = arch === "arm64" ? "arm" : "x86";
    } else {
        pPlatform = "Linux";
        pVersion = "";
    }
    return {
        brands,
        fullVersionList,
        platform: pPlatform,
        platformVersion: pVersion,
        architecture: pArch,
        model: "",
        mobile: false,
        bitness: "64",
        wow64: false
    };
}

export async function applyChromeSpoof(win: BrowserWindow) {
    const spoofChrome = Settings.store.spoofChrome ?? true;
    if (!spoofChrome) {
        console.log("[Tesktop Spoofer] spoofChrome disabled");
        return;
    }

    const spoofWindows = Settings.store.spoofWindows ?? false;
    const chromeVersion = process.versions.chrome;
    const major = chromeVersion.split(".")[0];

    const targetPlatform: "win32" | "darwin" | "linux" = spoofWindows ? "win32" : (process.platform as any);
    const targetArch = spoofWindows ? "x64" : process.arch;
    let targetVersion = "10.0";
    if (!spoofWindows) {
        if (process.platform === "darwin") targetVersion = (process as any).getSystemVersion?.() || "12.0.0";
        else targetVersion = release();
    }
    let jsPlatform = "Win32";
    if (targetPlatform === "darwin") jsPlatform = "MacIntel";
    else if (targetPlatform === "linux") jsPlatform = "Linux x86_64";

    const ua = generateUA(targetPlatform, major);
    const hints = generateHints(targetPlatform, targetArch, targetVersion, chromeVersion);

    win.webContents.userAgent = ua;

    const doSpoof = async () => {
        try {
            if (!win.webContents.debugger.isAttached()) {
                try {
                    win.webContents.debugger.attach("1.3");
                } catch {}
            }
            await win.webContents.debugger.sendCommand("Emulation.setUserAgentOverride", {
                userAgent: ua,
                platform: jsPlatform,
                userAgentMetadata: hints
            });
            console.log(`[Tesktop Spoofer] UA → ${hints.platform} (${hints.architecture}) ${ua.slice(0, 60)}...`);
        } catch (e) {
            console.warn("[Tesktop Spoofer] Failed", e);
        }
    };

    win.webContents.debugger.on("detach", (_e, r) => console.log("[Tesktop Spoofer] debugger detached:", r));
    win.webContents.on("did-navigate", doSpoof);
    await doSpoof();
}
