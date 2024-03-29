import path from 'path';
import { ChildProcess } from 'child_process';
import fs from 'fs-extra';
import * as Local from '@getflywheel/local';
import {
	getServiceContainer,
	childProcessMessagePromiseFactory,
	ChildProcessMessagePromiseHelper,
	workerFork,
} from '@getflywheel/local/main';
import { IPC_EVENTS, INSTANT_RELOAD_EVENTS } from '../constants';
import { STATUSES, InstantReloadStatus } from '../types';

const serviceContainer = getServiceContainer().cradle;

interface InstanceData {
	childProcess: ChildProcess;
	processMessageHelper: ChildProcessMessagePromiseHelper;
	hostname: string;
	port: string;
	proxyUrl: string;
}

export default class InstantReloadService {
	private _siteData: typeof serviceContainer.siteData;

	private _sendIPCEvent: typeof serviceContainer.sendIPCEvent;

	private _localLogger: typeof serviceContainer.localLogger;

	/**
	 * hash map of all browser sync instances by site id
	 */
	private _browserSyncInstances: { [key: string]: InstanceData | null } = {};

	constructor () {
		const { localLogger, siteData, sendIPCEvent } = serviceContainer;

		this._siteData = siteData;
		this._sendIPCEvent = sendIPCEvent;
		this._localLogger = localLogger;
	}

	/**
	 * Get a BrowserSync Instance Data by siteId
	 *
	 * @param siteId string
	 *
	 * @returns BrowserSyncInstance
	 */
	public getInstanceData (siteId: string): InstanceData | null {
		return this._browserSyncInstances[siteId];
	}

	/**
	 * Send an IPC event to update the status of a particular Instant Reload instance
	 *
	 * @param siteId string
	 * @param status InstantReloadStatus
	 */
	private _updateStatus (siteId: Local.Site['id'], status: InstantReloadStatus) {
		this._sendIPCEvent(IPC_EVENTS.UPDATE_STATUS, siteId, status);
	}

	/**
	 * Stop a BrowserSync connection by siteId
	 *
	 * @param siteId string
	 */
	public async stopConnection (site: Local.Site): Promise<void> {
		const instanceData = this.getInstanceData(site.id);

		if (!instanceData) {
			return;
		}

		this._updateStatus(site.id, STATUSES.STOPPING);

		await instanceData.processMessageHelper(
			INSTANT_RELOAD_EVENTS.DESTROY,
		);

		/**
		 * @todo ensure that the child process gets killed completely here
		 */
		try {
			instanceData.childProcess.kill();
		} catch (err) {
			this._localLogger.debug(`Error killing Instant Reload child process for ${site.name}. ${err}`);
		}

		this._browserSyncInstances[site.id] = null;

		// needed to update the addon redux store
		this._sendIPCEvent(IPC_EVENTS.SITE_INSTANCE_STOP, site.id);

		this._updateStatus(site.id, STATUSES.STOPPED);
	}

	/**
	 * Get the proxy URL for a Browser Sync instance by site id
	 * @param siteId string
	 * @return {string}
	 */
	public getProxyUrl (siteId: string): string {
		const instanceData = this.getInstanceData(siteId);

		if (!instanceData) {
			return '-';
		}

		return instanceData.proxyUrl;
	}

	public hasWpCache = (siteId: string): boolean => {
		const wpConfigPath = path.join(this._siteData.getSite(siteId).paths.webRoot, 'wp-config.php');

		const wpConfigContents = fs.readFileSync(wpConfigPath).toString().toLowerCase();

		const hasWpCache = !!wpConfigContents.match(/['"]wp_cache['"],\s*true/g);

		return hasWpCache;
	};

	/**
	 * Create a new BrowserSyncInstance
	 */
	public async createNewConnection (site: Local.Site): Promise<{ hostname: string, port: string }> {
		this._updateStatus(site.id, STATUSES.STARTING);

		const childProcess = workerFork(
			path.join(__dirname, 'instantReloadProcess'),
			{
				JEST_WORKER_ID: process.env.JEST_WORKER_ID,
			},
		);

		const processMessageHelper = childProcessMessagePromiseFactory(childProcess);

		const instantReloadUrl = await processMessageHelper<string>(
			INSTANT_RELOAD_EVENTS.CREATE,
			{
				site,
				webRoot: site.paths.webRoot,
				httpPort: site.httpPort,
				host: site.host,
			},
		);

		const { hostname, port } = new URL(instantReloadUrl);

		this._addNewInstance(
			site,
			{
				childProcess,
				hostname,
				port,
				processMessageHelper,
				proxyUrl: instantReloadUrl,
			},
		);

		childProcess.on('message', (message) => {
			const { name, payload } = message;

			if (name === INSTANT_RELOAD_EVENTS.FILE_CHANGED) {
				this._sendIPCEvent(
					IPC_EVENTS.FILE_CHANGED,
					site.id,
					{
						fileName: payload.file,
						eventType: payload.event,
						timeChanged: payload.timeChanged,
						fileSize: payload.fileSize,
					},
				);
			}
		});

		const hasWpCacheEnabled = this.hasWpCache(site.id);

		// needed to update the addon redux store
		this._sendIPCEvent(
			IPC_EVENTS.SITE_INSTANCE_START,
			site.id,
			{
				proxyUrl: `http://${hostname}:${port}`,
				hasWpCacheEnabled,
			},
		);

		return {
			hostname,
			port,
		};
	}

	public async addFileWatchers (site: Local.Site): Promise<void> {
		/**
		 * Don't set up file watchers again if already watching
		 */
		const instanceData = this.getInstanceData(site.id);

		if (!instanceData) {
			return;
		}

		await instanceData.processMessageHelper(
			INSTANT_RELOAD_EVENTS.WATCH,
			{
				webRoot: site.paths.webRoot,
				siteID: site.id,
			},
		);

		this._updateStatus(site.id, STATUSES.STARTED);
	}

	private _addNewInstance = (site: Local.Site, instanceData: InstanceData) => {
		this._browserSyncInstances[site.id] = { ...instanceData };
	}
}
