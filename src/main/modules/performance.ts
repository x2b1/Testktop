/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app } from "electron";

import { Settings } from "../settings";

export function applyPerformanceFlags() {
    if (Settings.store.performanceFlags) {
        console.log("[Tesktop Performance] Enabling canvas oop rasterization & gpu flags");
        app.commandLine.appendSwitch("ignore-gpu-blocklist");
        app.commandLine.appendSwitch("enable-gpu-rasterization");
        app.commandLine.appendSwitch("enable-zero-copy");
        app.commandLine.appendSwitch("disable-low-res-tiling");
        app.commandLine.appendSwitch("disable-site-isolation-trials");
        app.commandLine.appendSwitch("enable-hardware-overlays", "single-fullscreen,single-on-top,underlay");
        app.commandLine.appendSwitch("enable-native-gpu-memory-buffers");
    }

    if (Settings.store.disableGpuCompositing) {
        app.commandLine.appendSwitch("disable-gpu-compositing");
        console.log("[Tesktop Performance] GPU compositing disabled");
    }

    if (Settings.store.forceDedicatedGPU) {
        app.commandLine.appendSwitch("force_high_performance_gpu");
        console.log("[Tesktop Performance] Forcing dedicated GPU");
    }

    // Smoothness: VAAPI handling is done in startup.ts via hardwareVideoAcceleration,
    // but we expose toggle here for consistency with GoofCord
    if (Settings.store.vaapi === false) {
        console.log("[Tesktop Performance] VAAPI disabled per settings");
    }
}

export function applyRenderingOptimizationsCss(): string | null {
    if (Settings.store.renderingOptimizations === false) return null;
    // GoofCord's renderingOptimizations CSS
    return `
        [class*="messagesWrapper"], #channels, #emoji-picker-grid, [class*="membersWrap"] {
            will-change: transform, scroll-position;
            contain: strict;
        }
        /* Tesktop smoothness: reduce layout thrash */
        [class*="scroller"] {
            content-visibility: auto;
            contain-intrinsic-size: 1000px;
        }
    `;
}
