import { EventEmitter } from 'node:events';

import { Addon } from './types';

const SUPPORTED_PLATFORMS = ['win32'];

let addon: Addon | null = null;

if (SUPPORTED_PLATFORMS.includes(process.platform)) {
	addon = require('../build/Release/WindowsShutdownHandler.node'); // eslint-disable-line import/no-dynamic-require
}

class ElectronShutdownHandlerClass extends EventEmitter {
	constructor() {
		super();

		this.on('newListener', (event: string) => {
			if (event == 'shutdown' && this.listenerCount('shutdown') == 0) {
				// create native listener
				if (addon) {
					addon.insertWndProcHook(() => {
						this.emit('shutdown');
					});
				}
			}
		});

		this.on('removeListener', (event: string) => {
			if (event == 'shutdown' && this.listenerCount('shutdown') == 0) {
				// remove native listener
				if (addon) {
					addon.removeWndProcHook();
				}
			}
		});
	}

	setWindowHandle(handle: Buffer): void {
		if (!addon) {
			return;
		}

		addon.setMainWindowHandle(handle);
	}

	blockShutdown(reason: string): boolean {
		if (!addon) {
			return false;
		}

		return addon.acquireShutdownBlock(reason);
	}

	releaseShutdown(): boolean {
		if (!addon) {
			return false;
		}

		return addon.releaseShutdownBlock();
	}
}

const ElectronShutdownHandler = new ElectronShutdownHandlerClass();

export default ElectronShutdownHandler;
