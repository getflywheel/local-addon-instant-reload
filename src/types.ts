export interface FileChangeEntry {
	fileName: string,
	eventType: string,
	timeChanged: string,
	fileSize: string,
}


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

export interface InstanceStartPayload {
	proxyUrl: string
	hasWpCacheEnabled: boolean
}
