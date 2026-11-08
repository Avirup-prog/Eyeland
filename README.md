# 🏝️ Eyeland - The Living Bezel Companion & Assistant

**Eyeland** is a cross-platform (Windows & macOS) desktop Dynamic Island that docks flush against the physical top monitor bezel with zero gap. It combines a living desktop buddy with glowing minimalist eyes that track your mouse in real time, and **Eyeland AI**—a multimodal screen scanner, code debugger, and file staging shelf.

---

## ✨ Features

- **Zero-Gap Bezel Architecture (`Y = 0`)**: Sits directly against the top monitor display with inverted concave wings (`radial-gradient`), blending into your physical screen bezel.
- **Living Minimalist Eyes**: Soft-glowing OLED pill capsules that follow your cursor across any open window using Electron's 60fps OS cursor stream.
- **❤️ Pet & Rejoice**: Click the eyes to trigger a bouncy rejoice animation and happy crescents (`^ ^`) with floating hearts.
- **✨ Eyeland AI**:
  - **📸 Scan Screen**: 1-click full-screen snapshot (`desktopCapturer`) and multimodal analysis of your workspace.
  - **⚡ Fix Code**: Syntax debugger and stack trace fixer.
  - **Conversational LLM Prompting**: Chat directly with Eyeland AI.
- **🗂️ Staging Shelf**: A dedicated cross-screen file transporter. Drag and drop screenshots, PDFs, or archives onto the shelf, switch workspaces/screens, and drag them out to upload anywhere.
- **🎵 Music Player & ⏱️ Focus Pomodoro**: Live playback controls, visualizer waves, and 25-minute Pomodoro timers.
- **Bottom Icon Dock**: Pure icon navigation with glowing active indicators.

---

## 🚀 Quick Start

```powershell
# Navigate to the project
cd "D:\Dynamic Island Project"

# Run the desktop app
npm run dev
```

---

## 🛠️ Architecture

- **Desktop Host**: Electron 33 (Transparent, frameless, always-on-top, OS cursor tracking, `desktopCapturer` screen vision)
- **Frontend**: React 18 + Vite 6 + TailwindCSS 3
- **Animations**: CSS Spring cubic-bezier transitions + natural blinking loops
