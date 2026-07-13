class TerminalApp {
    constructor() {
        this.currentPath = '/home/user';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.windowId = null;
    }

    launch() {
        const outputElement = document.createElement('div');
        const output = document.createElement('div');
        output.className = 'terminal-output';
        output.id = 'terminal-output';
        output.style.minHeight = '200px';
        output.style.marginBottom = '12px';
        
        this.appendOutput(output, `WebOS Terminal v1.0 - Kernel Ready`);
        this.appendOutput(output, `Type 'help' for available commands`);
        this.appendOutput(output, '');

        const input = document.createElement('div');
        input.className = 'terminal-input';
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.placeholder = `${this.currentPath} $`;
        inputField.autocomplete = 'off';

        const executeBtn = document.createElement('button');
        executeBtn.textContent = 'Execute';

        input.appendChild(inputField);
        input.appendChild(executeBtn);

        outputElement.appendChild(output);
        outputElement.appendChild(input);

        const handleCommand = () => {
            const command = inputField.value.trim();
            if (!command) return;

            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;

            this.appendOutput(output, `<span class="terminal-prompt">${this.currentPath} $</span> ${command}`);
            const result = this.executeCommand(command);
            if (result) {
                this.appendOutput(output, result);
            }

            inputField.value = '';
            inputField.placeholder = `${this.currentPath} $`;
            output.scrollTop = output.scrollHeight;
        };

        executeBtn.addEventListener('click', handleCommand);
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    inputField.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    inputField.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    inputField.value = '';
                }
            }
        });

        this.windowId = compositor.createWindow({
            id: `terminal-${Date.now()}`,
            title: '❯_ Terminal',
            content: outputElement,
            width: 340,
            height: 500,
            x: 20,
            y: 100,
            app: 'terminal',
        });

        inputField.focus();
        return this.windowId;
    }

    executeCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                return this.getHelp();
            case 'ls':
                return this.listDirectory(args.length > 0 ? args[0] : this.currentPath);
            case 'cd':
                return this.changeDirectory(args[0]);
            case 'pwd':
                return this.currentPath;
            case 'mkdir':
                return this.makeDirectory(args[0]);
            case 'touch':
                return this.touchFile(args[0]);
            case 'cat':
                return this.readFile(args[0]);
            case 'echo':
                return args.join(' ');
            case 'top':
                return this.getProcessList();
            case 'uname':
                return this.getSystemInfo();
            case 'clear':
                return 'CLEAR';
            case 'exit':
                compositor.closeWindow(this.windowId);
                return null;
            case 'whoami':
                return 'user';
            case 'date':
                return new Date().toString();
            case 'free':
                return this.getMemoryInfo();
            default:
                return `Command not found: ${cmd}`;
        }
    }

    listDirectory(path) {
        try {
            const resolvedPath = this.resolvePath(path);
            const contents = kernel.listDirectory(resolvedPath);
            if (contents.length === 0) {
                return '(empty directory)';
            }
            return contents.map(name => {
                const fullPath = resolvedPath === '/' ? `/${name}` : `${resolvedPath}/${name}`;
                const entry = kernel.getFile(fullPath);
                const icon = entry && entry.type === 'directory' ? '📁' : '📄';
                return `  ${icon} ${name}`;
            }).join('\n');
        } catch (e) {
            return `ls: cannot open '${path}': No such file or directory`;
        }
    }

    changeDirectory(path) {
        if (!path) return `current directory: ${this.currentPath}`;
        try {
            const resolvedPath = this.resolvePath(path);
            const entry = kernel.getFile(resolvedPath);
            if (!entry) {
                return `cd: No such file or directory: ${path}`;
            }
            if (entry.type !== 'directory') {
                return `cd: not a directory: ${path}`;
            }
            this.currentPath = resolvedPath;
            return '';
        } catch (e) {
            return `cd: Error: ${e.message}`;
        }
    }

    makeDirectory(dirName) {
        if (!dirName) return 'mkdir: missing operand';
        try {
            const newPath = this.currentPath === '/' ? `/${dirName}` : `${this.currentPath}/${dirName}`;
            if (kernel.createDirectory(newPath)) {
                return '';
            } else {
                return `mkdir: cannot create directory '${dirName}': File exists`;
            }
        } catch (e) {
            return `mkdir: Error: ${e.message}`;
        }
    }

    touchFile(fileName) {
        if (!fileName) return 'touch: missing operand';
        try {
            const newPath = this.currentPath === '/' ? `/${fileName}` : `${this.currentPath}/${fileName}`;
            if (kernel.writeFile(newPath, '')) {
                return '';
            } else {
                return `touch: cannot create file '${fileName}'`;
            }
        } catch (e) {
            return `touch: Error: ${e.message}`;
        }
    }

    readFile(filePath) {
        if (!filePath) return 'cat: missing operand';
        try {
            const resolvedPath = this.resolvePath(filePath);
            const content = kernel.readFile(resolvedPath);
            if (content === null) {
                return `cat: ${filePath}: No such file or directory`;
            }
            return content || '(empty file)';
        } catch (e) {
            return `cat: Error: ${e.message}`;
        }
    }

    getProcessList() {
        const processes = kernel.getProcessList();
        if (processes.length === 0) {
            return 'No running processes';
        }
        let output = '  PID  NAME               MEM(MB)  CPU(%)\n';
        output += '  ' + '─'.repeat(40) + '\n';
        processes.forEach(proc => {
            output += `  ${String(proc.pid).padEnd(4)} ${proc.name.padEnd(15)} ${String(proc.memoryUsage.toFixed(1)).padEnd(8)} ${proc.cpuUsage.toFixed(1)}%\n`;
        });
        return output;
    }

    getSystemInfo() {
        const metrics = kernel.getSystemMetrics();
        const uptime = Math.floor(metrics.uptime / 1000);
        return `WebOS v1.0 (Kernel Emulator) - Uptime: ${uptime}s`;
    }

    getMemoryInfo() {
        const metrics = kernel.getSystemMetrics();
        const used = metrics.usedRAM;
        const total = metrics.totalRAM;
        const free = total - used;
        return `             total     used     free\nMem: ${String(total).padEnd(8)} ${String(used.toFixed(0)).padEnd(8)} ${String(free.toFixed(0))}MB`;
    }

    getHelp() {
        return `Available Commands:
  ls [path]          List directory contents
  cd [path]          Change directory
  pwd                Print working directory
  mkdir <dir>        Create directory
  touch <file>       Create file
  cat <file>         Read file
  echo <text>        Print text
  top                List running processes
  free               Show memory usage
  uname              System information
  whoami             Current user
  date               Current date/time
  clear              Clear terminal
  help               Show this help
  exit               Close terminal`;
    }

    resolvePath(path) {
        if (path.startsWith('/')) {
            return path === '/' ? '/' : path.replace(/\/$/, '');
        }
        if (path === '..' || path === '../') {
            return this.currentPath === '/' ? '/' : this.currentPath.substring(0, this.currentPath.lastIndexOf('/')) || '/';
        }
        if (path === '.' || path === './') {
            return this.currentPath;
        }
        const resolvedPath = this.currentPath === '/' ? `/${path}` : `${this.currentPath}/${path}`;
        return resolvedPath.replace(/\/$/, '');
    }

    appendOutput(element, text) {
        if (text === 'CLEAR') {
            element.innerHTML = '';
            return;
        }
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = text;
        element.appendChild(line);
    }
}

const terminalApp = new TerminalApp();
