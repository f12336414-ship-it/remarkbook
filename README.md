<div align="center">

# 🍦 RemarkBook · 备忘小窗

**A cute, Mac-style floating to-do widget that lives on your desktop.**
**一个可爱、Mac 风格的桌面浮窗备忘小工具。**

[English](#english) · [中文](#中文)

</div>

---

## English

RemarkBook is a tiny always-available notes & to-do window built with **Tauri + React**. It stays out of your way as a frosted mini-pill, and expands into a soft macaron-cream panel when you need it. Everything is stored locally on your machine — no account, no cloud.

### ✨ Features
- **Today view** — the main window shows only today's to-dos, kept clean and focused.
- **Weekly folder history** — past items are grouped Monday–Sunday into collapsible week → day folders you can browse and search.
- **Quick capture** — the input is hidden until you tap **+**, so the window stays tidy.
- **Macaron themes** — 6 presets (Cream 🍦 / Sakura 🌸 / Mint 🌿 / Lavender 💜 / Sea salt 🧊 / Midnight 🌙), plus custom accent color, light/dark mode, font size, and opacity.
- **Mac-style chrome** — frameless rounded window with traffic-light controls and a frosted look.
- **Mini floating mode** — collapse into a small always-handy pill in the corner.
- **Always on top** — pin the window above everything; opacity drops to 20% automatically so it never blocks your view, and restores when unpinned.
- **Bilingual** — switch between 中文 and English anytime in Settings.
- **Local-first** — all data lives in your browser's localStorage; nothing leaves your device.

### 📦 Download & Run
Grab the package for your OS from the [**Releases**](../../releases) page:

| OS | File | How to run |
|----|------|-----------|
| **Windows** | `RemarkBook_x64-setup.exe` | Double-click to install, then launch. |
| **macOS** | `RemarkBook_universal.dmg` | Open the `.dmg`, drag the app to Applications. (Intel + Apple Silicon) |
| **Linux** | `RemarkBook_amd64.AppImage` | `chmod +x` it and run directly — no install needed. |

> macOS may warn the app is from an unidentified developer — right-click → Open the first time.
> Windows needs WebView2 (preinstalled on Windows 10/11).

### 🛠️ Build from source
```bash
npm install
npm run tauri:dev     # run in development
npm run tauri:build   # produce a native package for your current OS
```
Requires Node 20+ and the Rust toolchain.

### 🧱 Tech stack
Tauri 2 · React 19 · TypeScript · Vite · lucide-react

---

## 中文

RemarkBook 是一个用 **Tauri + React** 做的桌面浮窗备忘小工具。平时它是一颗毛玻璃小药丸，安静待在角落；需要时展开成柔软的马卡龙奶油面板。所有数据都只保存在你本地，不需要账号，不上传云端。

### ✨ 功能
- **今日视图** —— 主窗口只显示「今天」的待办，干净专注。
- **按周文件夹历史** —— 过去的记录按周一到周日分组，折叠成「周 → 天」文件夹，可浏览、可搜索。
- **快速记录** —— 输入框默认隐藏，点 **+** 才出现，界面始终清爽。
- **马卡龙主题** —— 6 个预设（奶油 🍦 / 樱花 🌸 / 薄荷 🌿 / 薰衣草 💜 / 海盐 🧊 / 深夜 🌙），并可自定义主色、浅/深色、字号、透明度。
- **Mac 风格外观** —— 无边框圆角窗口，三色交通灯控制，毛玻璃质感。
- **迷你浮窗模式** —— 一键收起成角落里的小药丸，随手可用。
- **窗口置顶** —— 钉在所有窗口最前；置顶时透明度自动降到 20%，不挡视线，取消置顶后恢复。
- **中英双语** —— 在设置里随时切换中文 / English。
- **本地优先** —— 所有数据存在本地，不离开你的设备。

### 📦 下载与运行
在 [**Releases**](../../releases) 页面下载对应系统的包：

| 系统 | 文件 | 运行方式 |
|------|------|---------|
| **Windows** | `RemarkBook_x64-setup.exe` | 双击安装后启动。 |
| **macOS** | `RemarkBook_universal.dmg` | 打开 `.dmg`，把应用拖进「应用程序」。（兼容 Intel 与 Apple 芯片）|
| **Linux** | `RemarkBook_amd64.AppImage` | `chmod +x` 后直接运行，免安装。 |

> macOS 首次打开若提示「来自身份不明的开发者」，右键 →「打开」即可。
> Windows 需要 WebView2（Win10/11 已预装）。

### 🛠️ 从源码构建
```bash
npm install
npm run tauri:dev     # 开发运行
npm run tauri:build   # 为当前系统打包
```
需要 Node 20+ 和 Rust 工具链。

### 🧱 技术栈
Tauri 2 · React 19 · TypeScript · Vite · lucide-react

---

<div align="center">
<sub>Made with 🍦 · Licensed under MIT</sub>
</div>
