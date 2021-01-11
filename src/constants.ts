export const INSTANT_RELOAD = {
	START: 'startInstantReload',
	STOP: 'stopInstantReload',
	FILE_ADDED: 'instantReload:fileAdded',
	UPDATE_STATUS: 'instantReload:updateStatus',
};

export const STATUSES = {
	STOPPED: 'instantReload:stopped',
	STARTED: 'instantReload:started',
	STOPPING: 'instantReload:stopping',
	STARTING: 'instantReload:starting',
} as const;

/**
 * A typescript way to dynamically get a type that is one of the values from STATUES
 * see: https://stackoverflow.com/questions/53662208/types-from-both-keys-and-values-of-object-in-typescript
 */
type StatusKeys = keyof typeof STATUSES;
export type InstantReloadStatus = typeof STATUSES[StatusKeys];

export const INSTANCE_START = 'SiteInstance:Start';
export const INSTANCE_STOP = 'SiteInstance:Stop';

export interface InstantReloadStateParams {
	proxyUrl: string
	hasWpCacheEnabled: boolean
}

export const INSTANT_RELOAD_EVENTS = {
	CREATE: 'create-instance',
	GET: 'get-instance',
	DESTROY: 'destroy-instance',
	WATCH: 'start-file-watchers',
	GET_PROXY_URL: 'get-proxy-url',
	FILE_CHANGED: 'file-changed',
};

export const IPC_EVENTS = {
	ENABLE_INSTANT_RELOAD: 'instant-reload:enable-instant-reload',
	DISABLE_INSTANT_RELOAD: 'instant-reload:disable-instant-reload',
	GET_INITIAL_STATE: 'instant-reload:get-initial-state',
	SET_AUTO_ENABLE_INSTANT_RELOAD: 'instant-reload:set-auto-enable-instant-reload',
};
