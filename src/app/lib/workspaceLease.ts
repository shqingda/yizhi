export const WORKSPACE_LOCK = "yizhi:workspace:writer";

export interface WorkspaceLeaseHandle {
	readonly supported: boolean;
	readonly owned: boolean;
	beforeRelease?: () => void;
	acquire(): Promise<boolean>;
	release(): void;
}

/** The browser owns exclusion; localStorage is never used as a pretend mutex. */
export class WorkspaceLease implements WorkspaceLeaseHandle {
	supported = typeof navigator.locks?.request === "function";
	owned = false;
	beforeRelease?: () => void;
	private generation = 0;
	private unlock?: () => void;
	private cancelPending?: () => void;
	private pending?: Promise<boolean>;
	private finished: Promise<unknown> = Promise.resolve();

	acquire(): Promise<boolean> {
		if (this.owned) return Promise.resolve(true);
		if (!this.supported) return Promise.resolve(false);
		if (this.pending) return this.pending;
		const generation = this.generation;
		const previous = this.finished;
		let finish!: (owned: boolean) => void;
		const pending = new Promise<boolean>((resolve) => { finish = resolve; });
		this.pending = pending;
		this.cancelPending = () => finish(false);
		this.finished = previous.then(async () => {
			if (generation !== this.generation) return finish(false);
			await navigator.locks.request(WORKSPACE_LOCK, { mode: "exclusive", ifAvailable: true }, async (lock) => {
				if (!lock || generation !== this.generation) return finish(false);
				this.owned = true;
				await new Promise<void>((resolve) => {
					this.unlock = resolve;
					finish(true);
				});
			});
		}).catch(() => { this.supported = false; finish(false); });
		void pending.then(() => {
			if (this.pending === pending) {
				this.pending = undefined;
				this.cancelPending = undefined;
			}
		});
		return pending;
	}

	release() {
		try {
			if (this.owned) this.beforeRelease?.();
		} finally {
			this.generation += 1;
			this.owned = false;
			this.cancelPending?.();
			this.cancelPending = undefined;
			this.pending = undefined;
			this.unlock?.();
			this.unlock = undefined;
		}
	}
}
