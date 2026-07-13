# Web OS - Advanced Kernel Emulator

A production-grade, mobile-first Web OS ecosystem optimized for 9:16 mobile viewports. This is a comprehensive operating system emulator running entirely in the browser with a fully modular architecture.

## Architecture Overview

### Core Systems

#### `core/kernel_emulator.js`
Central kernel-space emulator featuring:
- **Process Management**: Virtual process manager with PID allocation, process lifecycle management, and resource tracking
- **Virtual Filesystem (VFS)**: Complete directory tree structure with localStorage persistence
- **Inter-Process Communication (IPC)**: Event-based messaging system for inter-app communication
- **System Metrics**: Real-time tracking of RAM, CPU, battery, and thermal levels

#### `core/gesture_engine.js`
High-performance touch gesture parser with:
- **Gesture Detection**: Captures swipe-down-from-top (Control Center), swipe-up-from-bottom (App Switcher), and directional swipes
- **Kinetic Scrolling**: Simulated friction physics for smooth deceleration
- **Event Suppression**: Aggressive suppression of default mobile browser behaviors (bouncing, pinch-zoom)
- **Raw Touch Streaming**: Direct touch event processing for low-latency response

#### `ui/compositor.js`
Dynamic desktop window compositor with:
- **Window Management**: Z-index layering, window positioning, and focus management
- **Glassmorphism**: Blur effects and translucent window styling
- **Safe Area Support**: Full support for notches and dynamic islands using `env(safe-area-inset-*)`
- **Responsive Layout**: Adaptive grid-based desktop layout

### System Applications

#### `apps/terminal.js`
Full-featured terminal emulator:
- **VFS Integration**: Complete filesystem navigation (ls, cd, mkdir, touch, cat)
- **Process Monitoring**: Real-time process list and system metrics (top, free, uname)
- **Command History**: Up/down arrow navigation through command history
- **Output Formatting**: ANSI-style terminal output with color support

#### `apps/settings.js`
System settings application:
- **Display Settings**: Dark mode toggle and brightness control
- **Audio Controls**: Sound and haptic feedback toggles
- **System Information**: Device name, kernel version, build number
- **Storage Monitoring**: Visual storage usage indicator

### User Interface

#### `index.html`
Main DOM entry point featuring:
- **Responsive Viewport**: Full 9:16 mobile-optimized layout
- **Status Bar**: Time, kernel status, and battery display
- **Homescreen**: App grid with functional icons
- **Control Center**: Quick settings accessible via swipe gesture
- **App Switcher**: Multitasking view with window thumbnails
- **Safe Area Insets**: Proper handling of notches and dynamic islands

#### `manifest.json`
Progressive Web App manifest with:
- **Standalone Mode**: Forces full-screen execution without browser UI
- **Hardware Acceleration**: GPU acceleration directives for smooth performance
- **Orientation Lock**: Portrait-primary orientation enforcement
- **App Icons**: Multiple icon sizes with maskable variants
- **Shortcuts**: Quick launch actions for Terminal and Settings

### Service Worker

#### `sw.js`
Offline-first service worker enabling:
- **Network Resilience**: Offline functionality with cached assets
- **Cache Versioning**: Automatic cache updates and cleanup
- **Intelligent Caching**: Network-first strategy with fallbacks
- **Persistent Storage**: Application state across browser sessions

## Features

### System Capabilities
- ✅ Virtual process scheduling with PID management
- ✅ Persistent filesystem with localStorage backend
- ✅ Event-driven inter-process communication
- ✅ Real-time system metrics and monitoring
- ✅ Multi-window desktop management
- ✅ Advanced touch gesture recognition
- ✅ Hardware-accelerated rendering
- ✅ Full offline support via Service Workers
- ✅ Progressive Web App installation
- ✅ Notch and dynamic island support

### Mobile Optimizations
- Touch-optimized interface with haptic feedback support
- Gesture-based navigation (swipe down for Control Center, swipe up for App Switcher)
- Kinetic scrolling with physical friction simulation
- Efficient viewport management with safe area insets
- Device-aware brightness and battery indicators
- Responsive window sizing and positioning

## Usage

### Installation
1. Deploy to a web server or serve locally
2. Open in a mobile browser (iOS Safari or Chrome)
3. Select "Add to Home Screen" to install as PWA
4. Application runs in full-screen standalone mode

### Terminal Commands
```bash
ls              # List directory contents
cd <path>       # Change directory
mkdir <name>    # Create directory
touch <file>    # Create file
cat <file>      # Read file
top             # List running processes
free            # Show memory usage
uname           # System information
help            # Show all commands
```

### System Gestures
- **Swipe Down from Top**: Open Control Center
- **Swipe Up from Bottom**: Open App Switcher
- **Swipe Down**: Close Control Center
- **Window Drag**: Click and drag titlebar to move
- **Window Focus**: Click window to bring to front

## Technical Specifications

### Viewport Targeting
- Primary: 9:16 portrait orientation (mobile phones)
- Secondary: Landscape support with adaptive layout
- Safe area support for notches and dynamic islands

### Performance
- GPU-accelerated compositing
- Kinetic scrolling with 60 FPS target
- Efficient event delegation
- Optimized re-renders via compositor
- Service Worker offline caching

### Compatibility
- iOS Safari 14+
- Chrome/Chromium 90+
- Firefox for Android 88+
- Samsung Internet 14+

### Storage
- Filesystem: localStorage (up to 5-10 MB per domain)
- Cache: Service Worker cache storage
- Session state: IndexedDB (future expansion)

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         User Interface Layer                │
│  ┌──────────────┐  ┌──────────────────┐   │
│  │  Terminal    │  │  Settings        │   │
│  │  Filesystem  │  │  Process Manager │   │
│  └──────────────┘  └──────────────────┘   │
└────────────┬────────────────────┬──────────┘
             │                    │
┌────────────▼────────────────────▼──────────┐
│        Compositor Layer (ui/)              │
│  Window Management & Desktop Rendering     │
└────────────┬────────────────────┬──────────┘
             │                    │
┌────────────▼────────────────────▼──────────┐
│      System Services Layer                 │
│  ┌──────────────┐  ┌──────────────────┐   │
│  │ Gesture      │  │ Kernel Emulator  │   │
│  │ Engine       │  │ & IPC Bus        │   │
│  └──────────────┘  └──────────────────┘   │
└────────────┬────────────────────┬──────────┘
             │                    │
┌────────────▼────────────────────▼──────────┐
│        Platform Layer                      │
│  Service Worker, localStorage, indexedDB   │
└────────────────────────────────────────────┘
```

## File Structure

```
.
├── index.html              # Main DOM entry point
├── manifest.json           # PWA manifest
├── app.js                  # Main application manager
├── sw.js                   # Service Worker
├── core/
│   ├── kernel_emulator.js  # Virtual kernel and process manager
│   └── gesture_engine.js   # Touch gesture recognition
├── ui/
│   └── compositor.js       # Window management and rendering
├── apps/
│   ├── terminal.js         # Terminal application
│   └── settings.js         # Settings application
└── README.md               # This file
```

## Future Enhancements
- Audio API integration for system sounds
- IndexedDB support for larger persistent storage
- Bluetooth API for device pairing
- Camera and media device integration
- WebRTC for peer communication
- Advanced graphics pipeline with WebGL
- Plugin system for user-developed applications
- Cloud synchronization for settings and files

## License

MIT License - Production-grade Web OS Kernel Emulator

## Author

n0xav - Advanced OS Architecture Team
