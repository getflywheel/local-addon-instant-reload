import * as Local from '@getflywheel/local';
import { getServiceContainer, HooksMain } from '@getflywheel/local/main';
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

	const toggleInstantReloadFactory = (autoEnableInstantReload: boolean) => (_, siteID: string) => {
		serviceContainer.siteData.updateSite(siteID, {
			autoEnableInstantReload,
		});
	};

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

	/**
	 * These IPC listeners are currently stubbed out waiting for the UI code port
	 */
	ipcMain.on(IPC_EVENTS.ENABLE_INSTANT_RELOAD, toggleInstantReloadFactory(true));

	ipcMain.on(IPC_EVENTS.DISABLE_INSTANT_RELOAD, toggleInstantReloadFactory(false));
}
