/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function isLocalArrpcHost(host: string): boolean {
    if (!host) return true;
    const normalized = host.toLowerCase().trim();
    if (normalized === "localhost") return true;
    if (normalized === "::1") return true;
    if (normalized === "0.0.0.0") return true;
    if (/^127(\.\d{1,3}){3}$/.test(normalized)) return true;
    if (normalized.startsWith("[::1]")) return true;
    return false;
}

export function sanitizeArrpcPort(port: unknown): number | undefined {
    const n = typeof port === "number" ? port : typeof port === "string" ? parseInt(port, 10) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > 65535) return undefined;
    return n;
}
