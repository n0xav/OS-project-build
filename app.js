class WebOSManager {
    constructor() {
        this.controlCenterOpen = false;
        this.appSwitcherMode = false;
        this.runningApps = new Map();
        this.systemMenuOpen = false;
        this.initializeUI();
        this.setupSystemGestures();
        this.setupStatusBar();
        this.setupControlCenter();
        this.setupAppSwitcher();
        this.spawnSystemProcesses();
        this.registerServiceWorker();
    }

    initializeUI() {
        document.getElementById('app-root').style.opacity = '1';
        document.addEventListener('click', (e) => {
            const appIcon = e.target.closest('[data-app]');
            if (appIcon) {
                const appName = appIcon.getAttribute('data-app');
                this.launchApp(appName);
            }
        });
    }

    setupSystemGestures() {
        gestureEngine.onGesture('gesture:swipe-down-from-top', (data) => {
            this.toggleControlCenter();
        });

        gestureEngine.onGesture('gesture:swipe-up-from-bottom', (data) => {
            this.toggleAppSwitcher();
        });

        gestureEngine.onGesture('gesture:swipe-right', (data) => {
            if (this.appSwitcherMode) {
                this.toggleAppSwitcher();
            }
        });
    }

    setupStatusBar() {
        setInterval(() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('time-display').textContent = `${hours}:${minutes}`;

            const metrics = kernel.getSystemMetrics();
            const batteryPercent = Math.floor(metrics.batteryLevel);
            const batteryIcon = metrics.batteryCharging ? '🔌' : '🔋';
            document.getElementById('battery-status').textContent = `${batteryIcon} ${batteryPercent}%`;
        }, 1000);
    }

    setupControlCenter() {
        const controlCenter = document.getElementById('control-center');
        const brightnessSlider = document.getElementById('brightness-slider');

        brightnessSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.body.style.filter = `brightness(${value / 100})`;
        });

        const quickSettings = document.querySelectorAll('.quick-setting-btn');
        quickSettings.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.toggle('active');
                const setting = btn.getAttribute('data-setting');
                this.handleQuickSetting(setting, btn.classList.contains('active'));
            });
        });
    }

    setupAppSwitcher() {
        const appSwitcher = document.getElementById('app-switcher');
        appSwitcher.addEventListener('click', (e) => {
            if (e.target.classList.contains('app-switcher-item')) {
                const appId = e.target.getAttribute('data-app-id');
                this.bringAppToFront(appId);
                this.toggleAppSwitcher();
            }
        });
    }

    toggleControlCenter() {
        const controlCenter = document.getElementById('control-center');
        this.controlCenterOpen = !this.controlCenterOpen;
        if (this.controlCenterOpen) {
            controlCenter.classList.add('active');
        } else {
            controlCenter.classList.remove('active');
        }
    }

    toggleAppSwitcher() {
        const appSwitcher = document.getElementById('app-switcher');
        this.appSwitcherMode = !this.appSwitcherMode;

        if (this.appSwitcherMode) {
            appSwitcher.style.display = 'flex';
            this.updateAppSwitcherDisplay();
        } else {
            appSwitcher.style.display = 'flex';
        }
    }

    updateAppSwitcherDisplay() {
        const appSwitcher = document.getElementById('app-switcher');
        appSwitcher.innerHTML = '';

        const windows = compositor.getAllWindows();
        windows.forEach((windowData, index) => {
            const item = document.createElement('div');
            item.className = 'app-switcher-item';
            item.setAttribute('data-app-id', windowData.id);
            item.textContent = windowData.title || 'App';
            if (compositor.focusedWindowId === windowData.id) {
                item.classList.add('active');
            }
            item.addEventListener('click', () => {
                compositor.focusWindow(windowData.id);
            });
            appSwitcher.appendChild(item);
        });
    }

    launchApp(appName) {
        if (this.runningApps.has(appName)) {
            compositor.bringToFront(this.runningApps.get(appName));
            return;
        }

        let windowId;
        switch (appName) {
            case 'terminal':
                kernel.spawnProcess('terminal', { priority: 60 });
                windowId = terminalApp.launch();
                break;
            case 'settings':
                kernel.spawnProcess('settings', { priority: 55 });
                windowId = settingsApp.launch();
                break;
            case 'processes':
                this.launchProcessManager();
                return;
            case 'filesystem':
                this.launchFileManager();
                return;
            default:
                console.log('Unknown app:', appName);
                return;
        }

        if (windowId) {
            this.runningApps.set(appName, windowId);
        }
    }

    launchProcessManager() {
        const container = document.createElement('div');
        const updateList = () => {
            const processes = kernel.getProcessList();
            container.innerHTML = '<div style="font-family: monospace; font-size: 12px; line-height: 1.6;">';
            container.innerHTML += '<div style="font-weight: bold; margin-bottom: 8px;">Running Processes</div>';
            container.innerHTML += '<div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px;">PID   NAME         MEM    CPU</div>';
            container.innerHTML += '<div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 8px;"></div>';

            if (processes.length === 0) {
                container.innerHTML += '<div>No processes</div>';
            } else {
                processes.forEach(p => {
                    container.innerHTML += `<div>${String(p.pid).padEnd(5)} ${p.name.padEnd(12)} ${p.memoryUsage.toFixed(0).padEnd(6)}MB ${p.cpuUsage.toFixed(1)}%</div>`;
                });
            }
            container.innerHTML += '</div>';
        };

        updateList();
        const interval = setInterval(updateList, 1000);

        compositor.createWindow({
            id: `processes-${Date.now()}`,
            title: '🔄 Processes',
            content: container,
            width: 340,
            height: 400,
            x: 20,
            y: 250,
            app: 'processes',
        });
    }

    launchFileManager() {
        const container = document.createElement('div');
        const updateFiles = () => {
            const contents = kernel.listDirectory('/');
            container.innerHTML = '<div style="font-size: 13px;">';
            contents.forEach(name => {
                const fullPath = `/${name}`;
                const entry = kernel.getFile(fullPath);
                const icon = entry && entry.type === 'directory' ? '📁' : '📄';
                container.innerHTML += `<div style="padding: 8px; cursor: pointer; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(100,200,255,0.1)'" onmouseout="this.style.background='transparent'">${icon} ${name}</div>`;
            });
            container.innerHTML += '</div>';
        };

        updateFiles();

        compositor.createWindow({
            id: `filesystem-${Date.now()}`,
            title: '📁 Files',
            content: container,
            width: 340,
            height: 450,
            x: 380,
            y: 250,
            app: 'filesystem',
        });
    }

    handleQuickSetting(setting, enabled) {
        switch (setting) {
            case 'airplane':
                console.log('Airplane mode:', enabled);
                break;
            case 'darkmode':
                console.log('Dark mode:', enabled);
                break;
        }
    }

    bringAppToFront(appId) {
        compositor.focusWindow(appId);
    }

    spawnSystemProcesses() {
        kernel.spawnProcess('systemd', { priority: 100, memoryUsage: 150 });
        kernel.spawnProcess('filesystem', { priority: 95, memoryUsage: 80 });
        kernel.spawnProcess('compositor', { priority: 90, memoryUsage: 200 });
        kernel.spawnProcess('gesture-daemon', { priority: 85, memoryUsage: 60 });
        kernel.spawnProcess('audio-service', { priority: 60, memoryUsage: 40 });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
    }
}

const webOSManager = new WebOSManager();
