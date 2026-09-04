/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { existsSync } from "fs";
import { join } from "path";

import { USER_AGENT } from "../constants";
import { VENCORD_DIR } from "../vencordDir";
import { downloadFile, fetchie } from "./http";

const API_BASE = "https://api.github.com";

export interface ReleaseData {
    name: string;
    tag_name: string;
    html_url: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

export async function githubGet(endpoint: string) {
    const opts: RequestInit = {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": USER_AGENT
        }
    };

    if (process.env.GITHUB_TOKEN) (opts.headers! as any).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    return fetchie(API_BASE + endpoint, opts, { retryOnNetworkError: true });
}

export async function downloadVencordAsar() {
    const urls = [
        "https://github.com/x2b1/Testcord/releases/latest/download/tesktop.asar",
        "https://github.com/x2b1/Testcord/releases/latest/download/equibop.asar",
        "https://github.com/Equicord/Equicord/releases/latest/download/equibop.asar"
    ];

    let lastError: unknown;
    for (const url of urls) {
        try {
            console.log(`[Tesktop] Trying to download ${url} ...`);
            await downloadFile(url, VENCORD_DIR, {}, { retryOnNetworkError: true });
            console.log(`[Tesktop] Downloaded from ${url}`);
            return;
        } catch (e) {
            console.warn(`[Tesktop] Failed to download from ${url}:`, (e as Error).message);
            lastError = e;
        }
    }
    throw lastError;
}

export function isValidVencordInstall(dir: string) {
    return existsSync(join(dir, "testktop/main.js"));
}

export async function ensureVencordFiles() {
    if (existsSync(VENCORD_DIR)) return;

    try {
        await downloadVencordAsar();
    } catch (e) {
        console.error(
            "[Tesktop] Failed to download Testcord/Euibop asar, app will start without mods. You can use --repair to retry:",
            e
        );
        // Do not throw — let app continue; user can repair later
        // Clean up partial file if exists
        try {
            const { unlinkSync } = await import("fs");
            if (existsSync(VENCORD_DIR)) unlinkSync(VENCORD_DIR);
        } catch {}
    }
}
