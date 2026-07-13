class SettingsApp {
    constructor() {
        this.theme = localStorage.getItem('webos_theme') || 'dark';
        this.windowId = null;
        this.settings = {
            darkMode: localStorage.getItem('webos_darkmode') !== 'false',
            brightness: localStorage.getItem('webos_brightness') || '100',
            volume: localStorage.getItem('webos_volume') || '70',
            soundEnabled: localStorage.getItem('webos_sound') !== 'false',
            hapticEnabled: localStorage.getItem('webos_haptic') !== 'false',
        };
    }

    launch() {
        const container = document.createElement('div');

        const html = `
            <div class="settings-group">
                <div class="settings-group-title">Display</div>
                <div class="settings-item">
                    <span class="settings-label">Dark Mode</span>
                    <div class="toggle-switch ${this.settings.darkMode ? 'active' : ''}" data-toggle="darkmode">
                        <div class="toggle-switch-thumb"></div>
                    </div>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Brightness</span>
                    <input type="range" min="0" max="100" value="${this.settings.brightness}" data-setting="brightness" style="width: 100%; margin-top: 8px;">
                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 4px;" id="brightness-value">${this.settings.brightness}%</div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Sound & Haptics</div>
                <div class="settings-item">
                    <span class="settings-label">Sound</span>
                    <div class="toggle-switch ${this.settings.soundEnabled ? 'active' : ''}" data-toggle="sound">
                        <div class="toggle-switch-thumb"></div>
                    </div>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Volume</span>
                    <input type="range" min="0" max="100" value="${this.settings.volume}" data-setting="volume" style="width: 100%; margin-top: 8px;">
                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 4px;" id="volume-value">${this.settings.volume}%</div>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Haptic Feedback</span>
                    <div class="toggle-switch ${this.settings.hapticEnabled ? 'active' : ''}" data-toggle="haptic">
                        <div class="toggle-switch-thumb"></div>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">System</div>
                <div class="settings-item">
                    <span class="settings-label">Device Name</span>
                    <span style="color: rgba(255, 255, 255, 0.7);">WebOS Device</span>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Kernel Version</span>
                    <span style="color: rgba(255, 255, 255, 0.7);">1.0.0</span>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Build Number</span>
                    <span style="color: rgba(255, 255, 255, 0.7);">2024.07.13</span>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Storage</div>
                <div class="settings-item" style="flex-direction: column; align-items: flex-start;">
                    <div style="width: 100%; margin-bottom: 8px;">
                        <span class="settings-label">System Storage</span>
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">1.2 GB used of 2 GB</div>
                    </div>
                    <div class="metric-bar" style="width: 100%;">
                        <div class="metric-fill" style="width: 60%;"></div>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">About</div>
                <div class="settings-item">
                    <span class="settings-label">© 2024 WebOS</span>
                </div>
                <div class="settings-item">
                    <span class="settings-label">Advanced Kernel Emulator</span>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const toggles = container.querySelectorAll('[data-toggle]');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const setting = toggle.getAttribute('data-toggle');
                this.toggleSetting(setting, toggle);
            });
        });

        const sliders = container.querySelectorAll('[data-setting]');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const setting = slider.getAttribute('data-setting');
                const value = slider.value;
                this.updateSetting(setting, value);
                document.getElementById(`${setting}-value`).textContent = value + '%';
            });
        });

        kernel.onIPCEvent('system:battery', (data) => {
            const batteryStatus = document.getElementById('battery-status');
            if (batteryStatus) {
                batteryStatus.textContent = Math.floor(data.level) + '%';
            }
        });

        this.windowId = compositor.createWindow({
            id: `settings-${Date.now()}`,
            title: '⚙️ Settings',
            content: container,
            width: 340,
            height: 600,
            x: 380,
            y: 100,
            app: 'settings',
        });

        return this.windowId;
    }

    toggleSetting(setting, element) {
        element.classList.toggle('active');

        switch (setting) {
            case 'darkmode':
                this.settings.darkMode = element.classList.contains('active');
                localStorage.setItem('webos_darkmode', this.settings.darkMode);
                document.body.style.filter = this.settings.darkMode ? 'invert(0)' : 'invert(0.9)';
                break;
            case 'sound':
                this.settings.soundEnabled = element.classList.contains('active');
                localStorage.setItem('webos_sound', this.settings.soundEnabled);
                break;
            case 'haptic':
                this.settings.hapticEnabled = element.classList.contains('active');
                localStorage.setItem('webos_haptic', this.settings.hapticEnabled);
                if (this.settings.hapticEnabled && navigator.vibrate) {
                    navigator.vibrate(20);
                }
                break;
        }
    }

    updateSetting(setting, value) {
        switch (setting) {
            case 'brightness':
                this.settings.brightness = value;
                localStorage.setItem('webos_brightness', value);
                document.body.style.filter = `brightness(${value / 100})`;
                break;
            case 'volume':
                this.settings.volume = value;
                localStorage.setItem('webos_volume', value);
                break;
        }
    }
}

const settingsApp = new SettingsApp();
