import * as Local from '@getflywheel/local';
import { getServiceContainer, HooksMain, addIpcAsyncListener } from '@getflywheel/local/main';
import InstantReload from './main/InstantReload';
import { IPC_EVENTS } from './constants';

const serviceContainer = getServiceContainer().cradle;

export default function (context: typeof serviceContainer.addonLoader.addonContext): void {
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
		'liveLinksServiceStartPort',
		(port: number, site: Local.Site) => {
			const instance = instantReload.getInstanceData(site.id);

			if (instance?.port) {
				return instance.port;
			}

			return port;
		},
	);

	HooksMain.addFilter(
		'liveLinksServiceStartHostname',
		(hostname: number, site: Local.Site) => {
			const instance = instantReload.getInstanceData(site.id);

			if (instance?.hostname) {
				return instance.hostname;
			}

			return hostname;
		},
	);

	addIpcAsyncListener(IPC_EVENTS.GET_INITIAL_STATE, () => {
		const sites = serviceContainer.siteData.getSites();
		const siteIDs = Object.keys(sites);

		return siteIDs.reduce((acc, siteID) => {
			acc.autoEnableInstantReload[siteID] = sites[siteID].autoEnableInstantReload;
			acc.instantReloadRunningBySite[siteID] = false;

			const instance = instantReload.getInstanceData(siteID);

			if (instance) {
				acc.proxyUrl[siteID] = instance.proxyUrl;
				acc.instantReloadRunningBySite[siteID] = true;
			}

			return acc;
		}, {
			proxyUrl: {},
			autoEnableInstantReload: {},
			instantReloadRunningBySite: {},
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
