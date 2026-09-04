/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app, protocol } from "electron";

import { handleVesktopAssetsProtocol } from "./userAssets";
import { handleVesktopStaticProtocol } from "./vesktopStatic";

protocol.registerSchemesAsPrivileged([
    {
        scheme: "tesktop",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    },
    {
        scheme: "testktop",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

app.whenReady().then(() => {
    const handler = async (req: Request) => {
        const url = new URL(req.url);

        switch (url.hostname) {
            case "assets":
                return handleVesktopAssetsProtocol(url.pathname, req);
            case "static":
                return handleVesktopStaticProtocol(url.pathname, req);
            default:
                return new Response(null, { status: 404 });
        }
    };
    protocol.handle("tesktop", handler);
    protocol.handle("testktop", handler);
});
