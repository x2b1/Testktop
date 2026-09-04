/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./updater";
import "./ipc";
import "./userAssets";
import "./vesktopProtocol";

import { app, BrowserWindow, nativeTheme } from "electron";

import { DATA_DIR } from "./constants";
import { createFirstLaunchTour } from "./firstLaunch";
import { createWindows } from "./mainWindow";
import { registerMediaPermissionsHandler } from "./mediaPermissions";
import { registerScreenShareHandler } from "./screenShare";
import { Settings, State } from "./settings";
import { setAsDefaultProtocolClient } from "./utils/setAsDefaultProtocolClient";
import { isDeckGameMode } from "./utils/steamOS";

console.log("Testktop v" + app.getVersion());

process.env.TESTCORD_USER_DATA_DIR = DATA_DIR;

const isLinux = process.platform === "linux";

export let enableHardwareAcceleration = true;

function init() {
    setAsDefaultProtocolClient("discord");

    // Tesktop GoofCord-inspired: ensure defaults for privacy/smoothness
    if (Settings.store.firewall === undefined) Settings.store.firewall = true;
    if (Settings.store.spoofChrome === undefined) Settings.store.spoofChrome = true;
    if (Settings.store.domOptimizer === undefined) Settings.store.domOptimizer = true;
    if (Settings.store.renderingOptimizations === undefined) Settings.store.renderingOptimizations = true;
    if (Settings.store.tabsEnabled === undefined) Settings.store.tabsEnabled = false;
    if (Settings.store.tabsPosition === undefined) Settings.store.tabsPosition = "top";

    // Apply GoofCord performance flags early
    try {
        const { applyPerformanceFlags } = require("./modules/performance");
        applyPerformanceFlags();
    } catch (e) {
        console.warn("[Tesktop] Failed to apply performance flags", e);
    }

    const { disableSmoothScroll, hardwareAcceleration, hardwareVideoAcceleration } = Settings.store;
    const { launchArguments } = State.store;

    const enabledFeatures = new Set(app.commandLine.getSwitchValue("enable-features").split(","));
    const disabledFeatures = new Set(app.commandLine.getSwitchValue("disable-features").split(","));
    app.commandLine.removeSwitch("enable-features");
    app.commandLine.removeSwitch("disable-features");

    if (hardwareAcceleration === false || process.argv.includes("--disable-gpu")) {
        enableHardwareAcceleration = false;
        app.disableHardwareAcceleration();
    } else {
        if (isLinux) {
            disabledFeatures.add("WaylandWpColorManagerV1");
            // Wayland + Vulkan are incompatible — disable Vulkan on Wayland (GoofCord parity, fixes ui/ozone error)
            if (process.env.XDG_SESSION_TYPE === "wayland" || !!process.env.WAYLAND_DISPLAY) {
                disabledFeatures.add("Vulkan");
            }
        }

        if (hardwareVideoAcceleration) {
            enabledFeatures.add("AcceleratedVideoEncoder");
            enabledFeatures.add("AcceleratedVideoDecoder");

            if (isLinux) {
                enabledFeatures.add("AcceleratedVideoDecodeLinuxGL");
                enabledFeatures.add("AcceleratedVideoDecodeLinuxZeroCopyGL");
            }
        }
    }

    if (disableSmoothScroll) {
        app.commandLine.appendSwitch("disable-smooth-scrolling");
    }

    app.commandLine.appendSwitch("disable-renderer-backgrounding");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
    app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
    if (process.platform === "win32") {
        disabledFeatures.add("CalculateNativeWinOcclusion");
    }

    if (launchArguments) {
        const args = launchArguments.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        for (const arg of args) {
            const cleanArg = arg.replace(/^["']|["']$/g, "");
            if (cleanArg.startsWith("--")) {
                const eqIndex = cleanArg.indexOf("=");
                if (eqIndex !== -1) {
                    const key = cleanArg.slice(2, eqIndex);
                    const value = cleanArg.slice(eqIndex + 1);
                    if (key === "enable-features") {
                        value.split(",").forEach(feature => enabledFeatures.add(feature));
                    } else if (key === "disable-features") {
                        value.split(",").forEach(feature => disabledFeatures.add(feature));
                    } else {
                        app.commandLine.appendSwitch(key, value);
                    }
                } else {
                    app.commandLine.appendSwitch(cleanArg.slice(2));
                }
            }
        }
        console.log("Applied launch arguments:", launchArguments);
    }

    app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

    disabledFeatures.add("WinRetrieveSuggestionsOnlyOnDemand");
    disabledFeatures.add("HardwareMediaKeyHandling");
    disabledFeatures.add("MediaSessionService");

    if (isLinux) {
        app.commandLine.appendSwitch("enable-speech-dispatcher");
        app.commandLine.appendSwitch("log-level", "3");
    }

    // Ensure Vulkan is disabled on Wayland regardless of how Wayland was requested
    const isWaylandEnv = process.env.XDG_SESSION_TYPE === "wayland" || !!process.env.WAYLAND_DISPLAY;
    const wantsWayland =
        isWaylandEnv ||
        (launchArguments && launchArguments.includes("wayland")) ||
        app.commandLine.getSwitchValue("ozone-platform") === "wayland" ||
        process.argv.includes("--wayland");
    if (isLinux && wantsWayland) {
        disabledFeatures.add("Vulkan");
        enabledFeatures.delete("Vulkan");
    }

    disabledFeatures.forEach(feat => enabledFeatures.delete(feat));

    const enabledFeaturesArray = [...enabledFeatures].filter(Boolean);
    const disabledFeaturesArray = [...disabledFeatures].filter(Boolean);

    if (enabledFeaturesArray.length) {
        app.commandLine.appendSwitch("enable-features", enabledFeaturesArray.join(","));
        console.log("Enabled Chromium features:", enabledFeaturesArray.join(", "));
    }

    if (disabledFeaturesArray.length) {
        app.commandLine.appendSwitch("disable-features", disabledFeaturesArray.join(","));
        console.log("Disabled Chromium features:", disabledFeaturesArray.join(", "));
    }

    if (isDeckGameMode) nativeTheme.themeSource = "dark";

    app.whenReady().then(async () => {
        if (process.platform === "win32") app.setAppUserModelId("org.testcord.testktop");

        // GoofCord-inspired privacy: firewall + proxy + CSP
        try {
            const { initFirewall, unstrictCSP, initProxy } = await import("./modules/privacyFirewall");
            initFirewall();
            unstrictCSP();
            initProxy();
        } catch (e) {
            console.warn("[Tesktop] Privacy modules failed", e);
        }

        registerScreenShareHandler();
        registerMediaPermissionsHandler();

        bootstrap();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindows();
        });
    });
}

init();

async function bootstrap() {
    if (!Object.hasOwn(State.store, "firstLaunch")) {
        createFirstLaunchTour();
    } else {
        createWindows();
    }
}

export let darwinURL: string | undefined;
app.on("open-url", (_, url) => {
    darwinURL = url;
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("web-contents-created", (_event, contents) => {
    contents.setWebRTCIPHandlingPolicy(Settings.store.webRTCIPHandlingPolicy ?? "default");
});
Settings.addChangeListener("webRTCIPHandlingPolicy", () => {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.setWebRTCIPHandlingPolicy(Settings.store.webRTCIPHandlingPolicy ?? "default");
    }
});
