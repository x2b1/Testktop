# Testktop [<img src="/static/icon.png" width="225" align="right" alt="Testktop">](https://github.com/x2b1/TestCord)

[![Testcord](https://img.shields.io/badge/Testcord-grey?style=flat)](https://github.com/x2b1/TestCord)
[![Tests](https://github.com/x2b1/TestCord/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/x2b1/TestCord/actions/workflows/test.yml)
[![Discord](https://img.shields.io/discord/1173279886065029291.svg?color=768AD4&label=Discord&logo=discord&logoColor=white)](https://testcord.org/discord)

Testktop is a fork of [Equibop](https://github.com/Equicord/Equibop).

You can join our [discord server](https://testcord.org/discord) for commits, changes, chat or even support.<br></br>

**Main features**:
- Testcord preinstalled
- Much more lightweight and faster than the official Discord app
- Linux Screenshare with sound & wayland
- Much better privacy, since Discord has no access to your system

**Extra included changes**

- Tray Customization with voice detection and notification badges
- Command-line flags to toggle microphone and deafen status (Linux)
- Custom Arguments from [this PR](https://github.com/Equicord/Equicord/pull/46)
- arRPC-bun with debug logging support https://github.com/Creationsss/arrpc-bun

**Not fully Supported**:
- Global Keybinds (Windows/macOS - use command-line flags on Linux instead)

## Tesktop Arguments
> [!NOTE]
> For the full list of supported flags and how to apply them, see the Tips & Tricks page!

### Quick reference

| Flag                            | Description                             |
|---------------------------------|-----------------------------------------|
| `--wayland` / `--ozone-platform=wayland` | Force native Wayland (auto enables WaylandWindowDecorations + VaapiVideoDecodeLinuxGL) |
| `--ozone-platform=x11`          | Force XWayland                          |
| `--no-sandbox`                  | Disable Chromium sandbox (use with caution, needed for root) |
| `--force_high_performance_gpu`  | Prefer discrete GPU                     |
| `--start-minimized`             | Launch minimized to tray                |
| `--toggle-mic`                  | Toggle mic (bind to shortcuts)          |
| `--toggle-deafen`               | Toggle deafen (bind to shortcuts)       |
| `--toggle-vad`                  | Toggle Voice Activity Detection (Voice Activity <-> Push To Talk) |

### Persistent flags

Add flags to `${XDG_CONFIG_HOME}/tesktop-flags.conf` — one per line, lines starting with `#` are comments.

```bash
--wayland
```
> Forces the application to use the **Ozone Wayland** platform. Automatically enables `WaylandWindowDecorations` + `VaapiVideoDecodeLinuxGL`.

```bash
--no-sandbox
```
> Disables the Chromium sandbox. Commonly used when the application is executed as root.

```bash
--force_high_performance_gpu
```
> Instructs the engine to prioritize the discrete (high-performance) GPU.

### Development and Build Arguments

```bash
--dev
```
> Enables development mode. Disables code minification, sets `IS_DEV` to `true`.

```bash
--watch
```
> Starts a persistent build context that monitors file changes and triggers automatic rebuilds.

**Rules for `tesktop-flags.conf`:**
- Empty lines are ignored
- Lines starting with `#` are treated as comments
- Valid entries are appended to the execution command

## Installing
Check the [Releases](https://github.com/x2b1/Testktop/releases) page

## Building from Source

You need to have the following dependencies installed:
- [Git](https://git-scm.com/downloads)
- [Bun](https://bun.sh)

Packaging will create builds in the dist/ folder

```sh
git clone https://github.com/x2b1/Testktop
cd Testktop

# Install Dependencies
bun install

# Either run it without packaging
bun start

# Or package (will build packages for your OS)
bun package

# Or only build the Linux Pacman package
bun package --linux pacman

# Or package to a directory only
bun package:dir
```

## Building LibVesktop from Source

This is a small C++ helper library Equibop uses on Linux to emit D-Bus events. By default, prebuilt binaries for x64 and arm64 are used.

If you want to build it from source:
1. Install build dependencies:
    - Debian/Ubuntu: `apt install build-essential python3 curl pkg-config libglib2.0-dev`
    - Fedora: `dnf install @c-development @development-tools python3 curl pkgconf-pkg-config glib2-devel`
2. Run `bun buildLibVesktop`
3. From now on, building Testktop will use your own build
