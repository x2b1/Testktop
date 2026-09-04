/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

interface Tab {
    id: string;
    title: string;
    url: string;
    unread?: number;
}

const STORAGE_KEY = "tesktop-tabs-v1";

function loadTabs(): { tabs: Tab[]; active: string } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const active = localStorage.getItem(STORAGE_KEY + ":active") || "main";
        if (raw) return { tabs: JSON.parse(raw), active };
    } catch {}
    return { tabs: [{ id: "main", title: "Discord", url: "https://discord.com/app" }], active: "main" };
}

function saveTabs(tabs: Tab[], active: string) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
        localStorage.setItem(STORAGE_KEY + ":active", active);
    } catch {}
}

export function mountTesktopTabs() {
    const { tabs: initialTabs, active: initialActive } = loadTabs();
    let tabs = initialTabs;
    let active = initialActive;

    // Inject styles
    if (!document.getElementById("tesktop-tabs-style")) {
        const style = document.createElement("style");
        style.id = "tesktop-tabs-style";
        style.textContent = `
            #tesktop-tab-strip {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.12));
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255,255,255,0.06);
                -webkit-app-region: drag;
                position: fixed;
                top: 0; left: 0; right: 0;
                height: 38px;
                z-index: 9999;
                font-family: var(--font-primary, sans-serif);
            }
            .tesktop-tab {
                -webkit-app-region: no-drag;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 8px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                color: var(--text-normal, #f3f3f3);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                min-width: 120px;
                max-width: 180px;
                transition: all 0.18s cubic-bezier(0.25,0.1,0.25,1);
                position: relative;
                overflow: hidden;
                user-select: none;
            }
            .tesktop-tab.active {
                background: #CC5F00;
                color: white;
                border-color: #E67E22;
                box-shadow: 0 2px 8px rgba(204,95,0,0.3);
            }
            .tesktop-tab:hover { background: rgba(255,255,255,0.12); transform: translateY(-0.5px); }
            .tesktop-tab.active:hover { background: #d4690a; }
            .tesktop-tab-close {
                margin-left: auto;
                width: 18px; height: 18px;
                border-radius: 50%;
                display: grid; place-items: center;
                opacity: 0.7; transition: 0.15s;
                flex-shrink: 0;
            }
            .tesktop-tab-close:hover { background: rgba(0,0,0,0.2); opacity: 1; }
            .tesktop-tab-add {
                -webkit-app-region: no-drag;
                width: 28px; height: 28px;
                border-radius: 8px;
                background: rgba(255,255,255,0.08);
                border: 1px dashed rgba(255,255,255,0.18);
                color: white;
                display: grid; place-items: center;
                cursor: pointer;
                transition: 0.15s;
                font-size: 18px; line-height: 1;
                flex-shrink: 0;
            }
            .tesktop-tab-add:hover { background: rgba(204,95,0,0.3); border-color: #CC5F00; transform: scale(1.05); }
            .tesktop-tabs-spacer { flex: 1; -webkit-app-region: drag; }
            body.tesktop-tabs-enabled { padding-top: 38px !important; }
            body.tesktop-tabs-enabled [class*="appMount"] { margin-top: 38px; }
        `;
        document.head.appendChild(style);
        document.body.classList.add("tesktop-tabs-enabled");
    }

    const container = document.createElement("div");
    container.id = "tesktop-tab-strip";
    container.setAttribute("role", "tablist");

    const render = () => {
        container.innerHTML = "";
        tabs.forEach(tab => {
            const el = document.createElement("div");
            el.className = `tesktop-tab ${active === tab.id ? "active" : ""}`;
            el.setAttribute("role", "tab");
            el.setAttribute("aria-selected", String(active === tab.id));
            el.title = tab.title;

            const icon = document.createElement("div");
            icon.style.cssText =
                "width:16px;height:16px;border-radius:4px;background:#5865f2;display:grid;place-items:center;font-size:9px;font-weight:800;color:white;flex-shrink:0;";
            icon.textContent = tab.title[0] || "D";
            el.appendChild(icon);

            const span = document.createElement("span");
            span.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;";
            span.textContent = tab.title;
            el.appendChild(span);

            if (tab.unread) {
                const badge = document.createElement("span");
                badge.style.cssText = "width:8px;height:8px;border-radius:50%;background:#ff3b30;flex-shrink:0;";
                el.appendChild(badge);
            }

            const close = document.createElement("span");
            close.className = "tesktop-tab-close";
            close.textContent = "×";
            close.onclick = e => {
                e.stopPropagation();
                if (tabs.length === 1) return;
                const idx = tabs.findIndex(t => t.id === tab.id);
                tabs = tabs.filter(t => t.id !== tab.id);
                if (active === tab.id) active = tabs[Math.max(0, idx - 1)].id;
                saveTabs(tabs, active);
                render();
            };
            el.appendChild(close);

            el.onclick = () => {
                active = tab.id;
                saveTabs(tabs, active);
                render();
                // In real multi-view impl, we'd switch BrowserView here
            };

            container.appendChild(el);
        });

        const addBtn = document.createElement("button");
        addBtn.className = "tesktop-tab-add";
        addBtn.setAttribute("aria-label", "New Tab");
        addBtn.textContent = "+";
        addBtn.onclick = () => {
            const id = Math.random().toString(36).slice(2, 8);
            const newTab: Tab = { id, title: `Tab ${tabs.length + 1}`, url: "https://discord.com/app" };
            tabs = [...tabs, newTab];
            active = id;
            saveTabs(tabs, active);
            render();
        };
        container.appendChild(addBtn);

        const spacer = document.createElement("div");
        spacer.className = "tesktop-tabs-spacer";
        container.appendChild(spacer);

        const info = document.createElement("div");
        info.style.cssText =
            "display:flex;gap:8px;align-items:center;color:rgba(255,255,255,0.6);font-size:11px;flex-shrink:0;";
        info.innerHTML = `<span style="display:flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:#30d158;box-shadow:0 0 6px #30d158;display:inline-block;"></span>Private</span><span style="width:1px;height:14px;background:rgba(255,255,255,0.12);display:inline-block;"></span><span>Tesktop Tabs</span>`;
        container.appendChild(info);
    };

    render();
    document.documentElement.appendChild(container);
}

export default mountTesktopTabs;
