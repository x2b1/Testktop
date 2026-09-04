/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { contextBridge, ipcRenderer } from "electron/renderer";

contextBridge.exposeInMainWorld("VesktopSplashNative", {
    onUpdateMessage(callback: (message: string) => void) {
        ipcRenderer.on("update-splash-message", (_, message: string) => callback(message));
    },
    onUpdateProgress(callback: (percentage: number) => void) {
        ipcRenderer.on("update-splash-progress", (_, percentage: number) => callback(percentage));
    },
    onSetProgressVisible(callback: (visible: boolean) => void) {
        ipcRenderer.on("set-splash-progress-visible", (_, visible: boolean) => callback(visible));
    }
});
