class KernelEmulator {
    constructor() {
        this.processes = new Map();
        this.nextPID = 1000;
        this.systemMetrics = {
            totalRAM: 2048,
            usedRAM: 512,
            batteryLevel: 100,
            batteryCharging: true,
            uptime: 0,
            bootTime: Date.now(),
            cpuUsage: 0,
            thermalLevel: 35,
        };
        this.filesystem = new Map();
        this.ipcBus = new EventTarget();
        this.initializeFilesystem();
        this.startSystemTick();
    }

    initializeFilesystem() {
        const fsData = localStorage.getItem('webos_filesystem');
        if (fsData) {
            try {
                const parsed = JSON.parse(fsData);
                this.filesystem = new Map(Object.entries(parsed));
            } catch (e) {
                this.createDefaultFilesystem();
            }
        } else {
            this.createDefaultFilesystem();
        }
    }

    createDefaultFilesystem() {
        this.filesystem.clear();
        this.filesystem.set('/', { type: 'directory', children: ['home', 'sys', 'var', 'boot'] });
        this.filesystem.set('/home', { type: 'directory', children: ['user'] });
        this.filesystem.set('/home/user', { type: 'directory', children: ['documents', 'downloads'] });
        this.filesystem.set('/home/user/documents', { type: 'directory', children: [] });
        this.filesystem.set('/home/user/downloads', { type: 'directory', children: [] });
        this.filesystem.set('/sys', { type: 'directory', children: ['config', 'devices'] });
        this.filesystem.set('/sys/config', { type: 'directory', children: [] });
        this.filesystem.set('/sys/devices', { type: 'directory', children: [] });
        this.filesystem.set('/var', { type: 'directory', children: ['log', 'cache'] });
        this.filesystem.set('/var/log', { type: 'directory', children: [] });
        this.filesystem.set('/var/cache', { type: 'directory', children: [] });
        this.filesystem.set('/boot', { type: 'directory', children: [] });
        this.saveFilesystem();
    }

    saveFilesystem() {
        const fsObject = Object.fromEntries(this.filesystem);
        localStorage.setItem('webos_filesystem', JSON.stringify(fsObject));
    }

    getFile(path) {
        return this.filesystem.get(path) || null;
    }

    listDirectory(path) {
        const entry = this.filesystem.get(path);
        if (!entry || entry.type !== 'directory') return [];
        return entry.children || [];
    }

    createDirectory(path) {
        if (this.filesystem.has(path)) return false;
        
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const parent = this.filesystem.get(parentPath);
        if (!parent || parent.type !== 'directory') return false;

        const dirName = path.substring(path.lastIndexOf('/') + 1);
        parent.children = parent.children || [];
        if (!parent.children.includes(dirName)) {
            parent.children.push(dirName);
        }

        this.filesystem.set(path, { type: 'directory', children: [] });
        this.saveFilesystem();
        this.emitIPCEvent('filesystem:changed', { action: 'mkdir', path });
        return true;
    }

    writeFile(path, content) {
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const parent = this.filesystem.get(parentPath);
        if (!parent || parent.type !== 'directory') return false;

        const fileName = path.substring(path.lastIndexOf('/') + 1);
        if (!parent.children) parent.children = [];
        if (!parent.children.includes(fileName)) {
            parent.children.push(fileName);
        }

        this.filesystem.set(path, { type: 'file', content, created: Date.now(), modified: Date.now() });
        this.saveFilesystem();
        this.emitIPCEvent('filesystem:changed', { action: 'write', path });
        return true;
    }

    readFile(path) {
        const entry = this.filesystem.get(path);
        if (!entry || entry.type !== 'file') return null;
        return entry.content || '';
    }

    deleteEntry(path) {
        if (!this.filesystem.has(path) || path === '/') return false;

        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const parent = this.filesystem.get(parentPath);
        if (parent && parent.children) {
            const name = path.substring(path.lastIndexOf('/') + 1);
            parent.children = parent.children.filter(c => c !== name);
        }

        this.filesystem.delete(path);
        this.saveFilesystem();
        this.emitIPCEvent('filesystem:changed', { action: 'delete', path });
        return true;
    }

    spawnProcess(name, options = {}) {
        const pid = this.nextPID++;
        const process = {
            pid,
            name,
            startTime: Date.now(),
            state: 'running',
            priority: options.priority || 50,
            memoryUsage: options.memoryUsage || Math.random() * 200,
            cpuUsage: options.cpuUsage || Math.random() * 30,
            children: [],
            parent: options.parent || null,
        };

        this.processes.set(pid, process);
        this.systemMetrics.usedRAM = Math.min(this.systemMetrics.usedRAM + process.memoryUsage, this.systemMetrics.totalRAM * 0.9);
        this.emitIPCEvent('process:spawned', { pid, name });
        return pid;
    }

    killProcess(pid) {
        const process = this.processes.get(pid);
        if (!process) return false;

        process.state = 'terminated';
        this.systemMetrics.usedRAM = Math.max(this.systemMetrics.usedRAM - process.memoryUsage, 0);
        setTimeout(() => {
            this.processes.delete(pid);
        }, 1000);
        this.emitIPCEvent('process:killed', { pid, name: process.name });
        return true;
    }

    getProcessList() {
        return Array.from(this.processes.values()).filter(p => p.state === 'running');
    }

    getSystemMetrics() {
        const uptime = Date.now() - this.systemMetrics.bootTime;
        this.systemMetrics.uptime = uptime;
        this.systemMetrics.cpuUsage = Math.min(50 + Math.random() * 30, 100);
        return { ...this.systemMetrics };
    }

    setBatteryLevel(level) {
        this.systemMetrics.batteryLevel = Math.max(0, Math.min(100, level));
        this.emitIPCEvent('system:battery', { level: this.systemMetrics.batteryLevel });
    }

    setCharging(charging) {
        this.systemMetrics.batteryCharging = charging;
        this.emitIPCEvent('system:charging', { charging });
    }

    emitIPCEvent(eventType, data) {
        const event = new CustomEvent('ipc-' + eventType, { detail: data });
        this.ipcBus.dispatchEvent(event);
    }

    onIPCEvent(eventType, callback) {
        this.ipcBus.addEventListener('ipc-' + eventType, (e) => callback(e.detail));
    }

    startSystemTick() {
        setInterval(() => {
            this.systemMetrics.cpuUsage = Math.sin(Date.now() / 5000) * 30 + 25;
            this.systemMetrics.thermalLevel = 35 + Math.random() * 15;
            
            if (!this.systemMetrics.batteryCharging) {
                this.systemMetrics.batteryLevel = Math.max(0, this.systemMetrics.batteryLevel - 0.001);
            }
        }, 100);
    }
}

const kernel = new KernelEmulator();
