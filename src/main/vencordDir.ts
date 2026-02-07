/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { join } from "path";

import { SESSION_DATA_DIR } from "./constants";
import { State } from "./settings";

// this is in a separate file to avoid circular dependencies
export const VENCORD_DIR = State.store.testcordDir
    ? join(State.store.testcordDir, "testktop")
    : join(SESSION_DATA_DIR, "testcord.asar");
