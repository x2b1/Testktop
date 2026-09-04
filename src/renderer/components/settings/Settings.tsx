/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./settings.css";

import { classNameFactory } from "@equicord/types/api/Styles";
import { BaseText, Divider, ErrorBoundary } from "@equicord/types/components";
import { ComponentType } from "react";
import { Settings, useSettings } from "renderer/settings";
import { isMac, isWindows } from "renderer/utils";

import { ArRPCSettingsButton } from "./ArRPCSettings";
import { AutoStartToggle } from "./AutoStartToggle";
import { DeveloperOptionsButton } from "./DeveloperOptions";
import { DiscordBranchPicker } from "./DiscordBranchPicker";
import { NotificationBadgeToggle } from "./NotificationBadgeToggle";
import { OutdatedVesktopWarning } from "./OutdatedVesktopWarning";
import { Updater } from "./Updater";
import { UserAssetsButton } from "./UserAssets";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";
import { WebRTCIPHandlingPolicyPicker } from "./WebRTCIPHandlingPolicyPicker";
import { WindowsTransparencyControls } from "./WindowsTransparencyControls";

interface BooleanSetting {
    key: keyof typeof Settings.store;
    title: string;
    description: string;
    defaultValue: boolean;
    disabled?(): boolean;
    invisible?(): boolean;
}

export const cl = classNameFactory("vcd-settings-");

export type SettingsComponent = ComponentType<{ settings: typeof Settings.store }>;

const SettingsOptions: Record<string, Array<BooleanSetting | SettingsComponent>> = {
    "Discord Branch": [DiscordBranchPicker],
    "System Startup & Performance": [
        AutoStartToggle,
        {
            key: "hardwareAcceleration",
            title: "Hardware Acceleration",
            description: "Enable hardware acceleration",
            defaultValue: true
        },
        {
            key: "hardwareVideoAcceleration",
            title: "Video Hardware Acceleration",
            description:
                "Enable hardware video acceleration. This can improve performance of screenshare and video playback, but may cause graphical glitches and infinitely loading streams.",
            defaultValue: false,
            disabled: () => Settings.store.hardwareAcceleration === false
        }
    ],
    "User Interface": [
        {
            key: "customTitleBar",
            title: "Discord Titlebar",
            description: "Use Discord's custom title bar instead of the native system one. Requires a full restart.",
            defaultValue: isWindows
        },
        {
            key: "staticTitle",
            title: "Static Title",
            description: 'Makes the window title "Tesktop" instead of changing to the current page',
            defaultValue: false
        },
        {
            key: "enableMenu",
            title: "Enable Menu Bar",
            description: "Enables the application menu bar. Press ALT to toggle visibility.",
            defaultValue: false,
            disabled: () => Settings.store.customTitleBar ?? isWindows
        },
        {
            key: "enableSplashScreen",
            title: "Enable Splash Screen",
            description:
                "Shows a small splash screen while Tesktop is loading. Disabling this option will show the main window earlier while it's still loading.",
            defaultValue: true
        },
        {
            key: "splashTheming",
            title: "Splash theming",
            description: "Adapt the splash window colors to your custom theme",
            defaultValue: true
        },
        {
            key: "splashProgress",
            title: "Show progress bar in Splash",
            description: "Adds a fancy progress bar to the splash window",
            defaultValue: false
        },
        WindowsTransparencyControls,
        UserAssetsButton
    ],
    Behaviour: [
        {
            key: "tray",
            title: "Tray Icon",
            description: "Add a tray icon for Tesktop",
            defaultValue: true,
            invisible: () => isMac
        },
        {
            key: "minimizeToTray",
            title: "Minimize to tray",
            description: "Hitting X will make Tesktop minimize to the tray instead of closing",
            defaultValue: true,
            invisible: () => isMac,
            disabled: () => Settings.store.tray === false
        },
        {
            key: "clickTrayToShowHide",
            title: "Hide/Show on tray click",
            description: "Left clicking tray icon will toggle the Tesktop window visibility.",
            defaultValue: false
        },
        {
            key: "disableMinSize",
            title: "Disable minimum window size",
            description: "Allows you to make the window as small as your heart desires",
            defaultValue: false
        },
        {
            key: "disableSmoothScroll",
            title: "Disable smooth scrolling",
            description: "Disables smooth scrolling",
            defaultValue: false
        }
    ],
    Notifications: [
        NotificationBadgeToggle,
        {
            key: "enableTaskbarFlashing",
            title: "Enable Taskbar Flashing",
            description: "Flashes the app in your taskbar when you have new notifications.",
            defaultValue: false
        }
    ],
    "Privacy & Security (GoofCord)": [
        {
            key: "firewall",
            title: "Privacy Firewall",
            description:
                "Blocks Discord telemetry, tracking and analytics (sentry, google, science). Inspired by GoofCord.",
            defaultValue: true
        },
        {
            key: "spoofChrome",
            title: "Spoof Chrome",
            description: "Emulates Chrome browser to better blend in and improve privacy (also helps VPN bypass).",
            defaultValue: true
        },
        {
            key: "spoofWindows",
            title: "Spoof Windows (VPN Bypass)",
            description: "Reports OS as Windows on Linux/macOS. Enable if Discord blocks you on VPN.",
            defaultValue: false,
            disabled: () => Settings.store.spoofChrome === false
        },
        {
            key: "invidiousEmbeds",
            title: "Invidious Embeds",
            description: "Replace YouTube embeds with privacy-friendly Invidious. Requires restart.",
            defaultValue: false
        },
        {
            key: "messageEncryption",
            title: "Message Encryption",
            description:
                "Enable end-to-end message encryption (GoofCord stegcloak-inspired). Adds /tesktop-encrypt command.",
            defaultValue: false
        },
        {
            key: "proxyEnabled",
            title: "Proxy",
            description: "Route Discord traffic through custom proxy (Tesktop privacy).",
            defaultValue: false
        }
    ],
    Smoothness: [
        {
            key: "domOptimizer",
            title: "DOM Optimizer",
            description: "Defers heavy DOM updates to improve smoothness. May cause minor visual artifacts.",
            defaultValue: true
        },
        {
            key: "renderingOptimizations",
            title: "Rendering Optimizations",
            description:
                "Applies CSS containment for smoother scrolling. Text may appear blurry with some themes. (FORCE DISABLED — was breaking account switcher positioning)",
            defaultValue: false,
            disabled: () => true
        },
        {
            key: "performanceFlags",
            title: "Performance Flags",
            description: "Enables experimental Chromium flags (CanvasOopRasterization, zero-copy, etc).",
            defaultValue: false
        },
        {
            key: "forceDedicatedGPU",
            title: "Force Dedicated GPU",
            description: "Forces Tesktop to use discrete GPU if available.",
            defaultValue: false
        },
        {
            key: "vaapi",
            title: "VA-API (Linux)",
            description: "Enable Video Acceleration API for hardware video decode on Linux.",
            defaultValue: true,
            disabled: () => Settings.store.hardwareAcceleration === false
        },
        {
            key: "disableGpuCompositing",
            title: "Disable GPU Compositing",
            description: "May fix screenshare black screen for viewers but reduces performance.",
            defaultValue: false
        },
        {
            key: "disableSettingsAnimations",
            title: "Disable Settings Animations",
            description: "Remove transition animations in settings for snappier feel.",
            defaultValue: false
        },
        {
            key: "popoutWindowAlwaysOnTop",
            title: "Popout Always On Top",
            description: "Keep Discord popout windows (e.g., voice) always on top.",
            defaultValue: true
        }
    ],
    Tabs: [
        {
            key: "tabsEnabled",
            title: "Enable Tesktop Tabs",
            description:
                "Show modern browser-like tabs at top for multi-guild navigation. Tesktop innovation — sleek, smooth & private. (FORCE DISABLED — wrongly integrated, will return)",
            defaultValue: false,
            disabled: () => true
        },
        {
            key: "tabsShowNavigationButtons",
            title: "Tab Navigation Buttons",
            description: "Show back/forward navigation in tab bar.",
            defaultValue: false,
            disabled: () => Settings.store.tabsEnabled === false
        }
    ],
    "Rich Presence": [ArRPCSettingsButton],
    Miscellaneous: [
        {
            key: "middleClickAutoscroll",
            title: "Middle Click Autoscroll",
            description: "Enables middle-click scrolling (Requires a full restart)",
            defaultValue: false
        },
        {
            key: "openLinksWithElectron",
            title: "Open Links in app (experimental)",
            description: "Opens links in a new Tesktop window instead of your web browser",
            defaultValue: false
        },
        WebRTCIPHandlingPolicyPicker
    ],
    "Developer Options": [DeveloperOptionsButton]
};

function SettingsSections() {
    const Settings = useSettings();

    const sections = Object.entries(SettingsOptions).map(([title, settings], i, arr) => (
        <div key={title} className={cl("category")}>
            <BaseText size="lg" weight="semibold" tag="h3" className={cl("category-title")}>
                {title}
            </BaseText>

            <div className={cl("category-content")}>
                {settings.map((Setting, i) => {
                    if (typeof Setting === "function") return <Setting key={`Custom-${i}`} settings={Settings} />;

                    const { defaultValue, title, description, key, disabled, invisible } = Setting;
                    if (invisible?.()) return null;

                    return (
                        <VesktopSettingsSwitch
                            title={title}
                            description={description}
                            value={Settings[key as any] ?? defaultValue}
                            onChange={v => (Settings[key as any] = v)}
                            disabled={disabled?.()}
                            key={key}
                        />
                    );
                })}
            </div>

            {i < arr.length - 1 && <Divider className={cl("category-divider")} />}
        </div>
    ));

    return <>{sections}</>;
}

export default ErrorBoundary.wrap(
    function SettingsUI() {
        return (
            <section>
                <Updater />
                <OutdatedVesktopWarning />
                <SettingsSections />
            </section>
        );
    },
    {
        message:
            "Failed to render the Tesktop Settings tab. If this issue persists, try to right click the Tesktop tray icon, then click 'Repair Tesktop'. And make sure your Tesktop is up to date."
    }
);
