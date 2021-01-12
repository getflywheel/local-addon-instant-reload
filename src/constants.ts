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
	UPDATE_STATUS: 'instant-reload:update-status',
	FILE_CHANGED: 'instant-reload:file-changed',
	SITE_INSTANCE_START: 'instant-reload:site-instance-start',
	SITE_INSTANCE_STOP: 'instant-reload:site-instance-stop',
};
