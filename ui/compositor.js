class Compositor {
    constructor() {
        this.windows = new Map();
        this.windowStack = [];
        this.zIndexCounter = 100;
        this.gridSize = 16;
        this.desktopElement = document.getElementById('desktop');
        this.focusedWindowId = null;
        this.setupCompositor();
    }

    setupCompositor() {
        this.desktopElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('desktop')) {
                this.defocusAll();
            }
        });
    }

    createWindow(config) {
        const windowId = config.id || `window-${Date.now()}`;
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.style.zIndex = this.zIndexCounter++;

        const titlebar = document.createElement('div');
        titlebar.className = 'window-titlebar';
        titlebar.innerHTML = `
            <div class="window-title">${config.title || 'Window'}</div>
            <div class="window-controls">
                <button class="window-btn minimize" data-action="minimize">−</button>
                <button class="window-btn close" data-action="close">×</button>
            </div>
        `;

        const content = document.createElement('div');
        content.className = 'window-content';
        if (config.content) {
            if (typeof config.content === 'string') {
                content.innerHTML = config.content;
            } else {
                content.appendChild(config.content);
            }
        }

        windowElement.appendChild(titlebar);
        windowElement.appendChild(content);
        this.desktopElement.appendChild(windowElement);

        const windowData = {
            id: windowId,
            element: windowElement,
            title: config.title,
            width: config.width || 300,
            height: config.height || 400,
            x: config.x || 20,
            y: config.y || 60,
            minimized: false,
            app: config.app || null,
        };

        this.windows.set(windowId, windowData);
        this.windowStack.push(windowId);

        this.updateWindowPosition(windowId, windowData.x, windowData.y);
        this.updateWindowSize(windowId, windowData.width, windowData.height);

        this.setupWindowEvents(windowId, titlebar, windowElement);
        this.focusWindow(windowId);

        return windowElement;
    }

    setupWindowEvents(windowId, titlebar, windowElement) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let windowStartX = 0;
        let windowStartY = 0;

        titlebar.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const windowData = this.windows.get(windowId);
            windowStartX = windowData.x;
            windowStartY = windowData.y;
            this.focusWindow(windowId);
        });

        titlebar.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            const windowData = this.windows.get(windowId);
            windowStartX = windowData.x;
            windowStartY = windowData.y;
            this.focusWindow(windowId);
        });

        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            const windowData = this.windows.get(windowId);
            const deltaX = clientX - dragStartX;
            const deltaY = clientY - dragStartY;
            this.updateWindowPosition(windowId, windowStartX + deltaX, windowStartY + deltaY);
        };

        document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        });

        const handleEnd = () => {
            isDragging = false;
        };

        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);

        const closeBtn = titlebar.querySelector('[data-action="close"]');
        const minimizeBtn = titlebar.querySelector('[data-action="minimize"]');

        closeBtn.addEventListener('click', () => this.closeWindow(windowId));
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));

        windowElement.addEventListener('click', () => this.focusWindow(windowId));
    }

    updateWindowPosition(windowId, x, y) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const minX = 0;
        const maxX = window.innerWidth - windowData.width;
        const minY = Math.max(50, 0);
        const maxY = window.innerHeight - 50;

        windowData.x = Math.max(minX, Math.min(x, maxX));
        windowData.y = Math.max(minY, Math.min(y, maxY));

        windowData.element.style.left = windowData.x + 'px';
        windowData.element.style.top = windowData.y + 'px';
    }

    updateWindowSize(windowId, width, height) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.width = Math.max(280, Math.min(width, window.innerWidth - 20));
        windowData.height = Math.max(200, Math.min(height, window.innerHeight - 100));

        windowData.element.style.width = windowData.width + 'px';
        windowData.element.style.height = windowData.height + 'px';
    }

    focusWindow(windowId) {
        if (this.focusedWindowId === windowId) return;

        if (this.focusedWindowId) {
            const prevWindow = this.windows.get(this.focusedWindowId);
            if (prevWindow) {
                prevWindow.element.classList.remove('focused');
            }
        }

        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.classList.add('focused');
            windowData.element.style.zIndex = this.zIndexCounter++;
            this.focusedWindowId = windowId;

            this.windowStack = this.windowStack.filter(id => id !== windowId);
            this.windowStack.push(windowId);
        }
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.minimized = !windowData.minimized;
        if (windowData.minimized) {
            windowData.element.style.opacity = '0';
            windowData.element.style.pointerEvents = 'none';
        } else {
            windowData.element.style.opacity = '1';
            windowData.element.style.pointerEvents = 'auto';
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.style.opacity = '0';
        windowData.element.style.transform = 'scale(0.9)';
        windowData.element.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => {
            windowData.element.remove();
            this.windows.delete(windowId);
            this.windowStack = this.windowStack.filter(id => id !== windowId);
            if (this.focusedWindowId === windowId) {
                this.focusedWindowId = null;
                const nextWindow = this.windowStack[this.windowStack.length - 1];
                if (nextWindow) this.focusWindow(nextWindow);
            }
        }, 300);
    }

    defocusAll() {
        this.windows.forEach(windowData => {
            windowData.element.classList.remove('focused');
        });
        this.focusedWindowId = null;
    }

    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    bringToFront(windowId) {
        this.focusWindow(windowId);
    }
}

const compositor = new Compositor();
