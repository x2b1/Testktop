/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { contextBridge, ipcRenderer } from "electron/renderer";

contextBridge.exposeInMainWorld("VesktopArRPCNative", {
    onStatusUpdate(callback: (status: unknown) => void) {
        ipcRenderer.on("arrpc-status-update", (_, status: unknown) => callback(status));
    }
});
