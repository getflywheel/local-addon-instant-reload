import * as Local from '@getflywheel/local';
import { getServiceContainer, HooksMain, addIpcAsyncListener } from '@getflywheel/local/main';
import InstantReload from './main/InstantReload';
import { IPC_EVENTS } from './constants';

const serviceContainer = getServiceContainer().cradle;

export default function (context: typeof serviceContainer.addonLoader.addonContext): void {
	const { electron } = context;
	const { ipcMain } = electron;
	const instantReload = new InstantReload();

	HooksMain.addAction('siteStarted', async (site: Local.Site) => {
		try {

			if (site.autoEnableInstantReload) {
				await instantReload.createNewConnection(site);
				/**
				 * @todo investigate adding file watchers after the Local router restarts
				 */
				instantReload.addFileWatchers(site);
			}
		} catch (err) {
			throw new Error(err);
		}
	});

	HooksMain.addAction('siteStopped', async (site: Local.Site) => {
		await instantReload.stopConnection(site);
	});

	HooksMain.addFilter(
		'routerServiceProxyPass',
		(proxyPassValue: string, site: Local.Site) => {
			const instance = instantReload.getInstanceData(site.id);

			if (instance?.hostname && instance?.port) {
				return `proxy_pass http://${instance.hostname}:${instance.port};`;
			}

			return proxyPassValue;
		},
	);

	HooksMain.addFilter(
		'liveLinksProServiceStartPort',
		(port: number, site: Local.Site) => {
			const instance = instantReload.getInstanceData(site.id);

			if (instance?.port) {
				return instance.port;
			}

			return port;
		},
	);

	HooksMain.addFilter(
		'liveLinksProServiceStartHostname',
		(hostname: number, site: Local.Site) => {
			const instance = instantReload.getInstanceData(site.id);

			if (instance?.hostname) {
				return instance.hostname;
			}

			return hostname;
		},
	);

	const toggleInstantReloadFactory = (autoEnableInstantReload: boolean) => (_, siteID: string) => {
		serviceContainer.siteData.updateSite(siteID, {
			autoEnableInstantReload,
		});
	};

	/**
	 * These IPC listeners are currently stubbed out waiting for the UI code port
	 */
	ipcMain.on(IPC_EVENTS.ENABLE_INSTANT_RELOAD, toggleInstantReloadFactory(true));

	ipcMain.on(IPC_EVENTS.DISABLE_INSTANT_RELOAD, toggleInstantReloadFactory(false));

	addIpcAsyncListener(IPC_EVENTS.GET_INITIAL_STATE, () => {
		const sites = serviceContainer.siteData.getSites();
		const siteIDs = Object.keys(sites);

		return siteIDs.reduce((acc, siteID) => {
			acc.autoEnableInstantReload[siteID] = sites[siteID].autoEnableInstantReload;

			const instance = instantReload.getInstanceData(siteID);

			if (instance) {
				acc.proxyUrl[siteID] = instance.proxyUrl;
			}

			return acc;
		}, {
			proxyUrl: {},
			autoEnableInstantReload: {},
		});
	});

	addIpcAsyncListener(IPC_EVENTS.SET_AUTO_ENABLE_INSTANT_RELOAD, (siteID: string, autoEnableInstantReload: boolean) => {
		let result;
		try {
			result = serviceContainer.siteData.updateSite(siteID, { autoEnableInstantReload });
		} catch (err) {
			console.error(err);
		}

		return result;
	});
}
