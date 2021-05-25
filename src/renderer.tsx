import fs from 'fs-extra';
import path from 'path';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import type { Site } from '@getflywheel/local';
import { ipcAsync } from '@getflywheel/local/renderer';
import { store, actions } from './renderer/store/store';
import InstantReload from './renderer/components/InstantReloadContent';
import { IPC_EVENTS } from './constants';
import { client } from './renderer/localClient/localGraphQLClient';
import type { FileChangeEntry, InstanceStartPayload } from './types';
import StatusIndicator from './renderer/components/StatusIndicator';
import SiteOverviewHostRow from './renderer/components/SiteOverviewHostRow';

const packageJSON = fs.readJsonSync(path.join(__dirname, '../package.json'));
const addonName = packageJSON.productName;
const addonID = packageJSON.slug;

const withApolloProvider = (Component) => (props) => (
	<ApolloProvider client={client}>
		<Component {...props} />
	</ApolloProvider>
);

const withStoreProvider = (Component) => (props) => (
	<Provider store={store}>
		<Component {...props} />
	</Provider>
);

export default async function (context): Promise<void> {
	const { React, hooks, electron } = context;
	const { ipcRenderer } = electron;

	const { autoEnableInstantReload, proxyUrl, instantReloadRunningBySite } = await ipcAsync(IPC_EVENTS.GET_INITIAL_STATE);

	store.dispatch(actions.setInstantReloadAutoEnabledInitialState(autoEnableInstantReload));
	store.dispatch(actions.setInstantReloadRunningInitialState(instantReloadRunningBySite));
	store.dispatch(actions.setProxyUrlInitialState(proxyUrl));

	const InstantReloadHOC = withApolloProvider(withStoreProvider(InstantReload));
	const StatusIndicatorHOC = withStoreProvider(StatusIndicator);
	const SiteOverviewHostRowHOC = withStoreProvider(SiteOverviewHostRow);

	// Add menu option within the site menu bar
	hooks.addFilter('siteInfoToolsItem', (menu) => {
		menu.push({
			path: `/${addonID}`,
			menuItem: `${addonName}`,
			render: ({ site }) => (
				<InstantReloadHOC site={site}/>
			),
		});

		return menu;
	});

	hooks.addContent('SiteInfo_Top_TopRight', (site: Site) => (
		<StatusIndicatorHOC siteID={site.id} />
	));

	hooks.addContent('SiteInfoOverview_TableList:Before', (site: Site, host: string) => (
		<SiteOverviewHostRowHOC site={site} host={host}/>
	));

	const urlFilterFactory = (wpAdmin: boolean) => (url: string, site: Site) => {
		const state = store.getState();
		console.log(state.instantReloadRunning, 'renderer.tsx line 62', global.localhostRouting && state.instantReloadRunning[site.id]);
		/* @ts-ignore ignoring the next line since TS doesn't know about the presence of localhostRouting */
		if (global.localhostRouting && state.instantReloadRunning[site.id]) {
			return `${state.proxyUrl[site.id]}${wpAdmin ? '/wp-admin/' : ''}`;
		}
		console.log(url, 'renderer.tsx line 67 addon');
		return url;
	};

	hooks.addFilter(
		'openSiteUrl',
		urlFilterFactory(false),
	);

	hooks.addFilter(
		'openSiteAdminUrl',
		urlFilterFactory(true),
	);

	ipcRenderer.on(IPC_EVENTS.FILE_CHANGED, (_, siteID: string, fileChangeEntry: FileChangeEntry) => {
		store.dispatch(actions.fileChange({ siteID, fileChangeEntry }));
	});

	ipcRenderer.on(
		IPC_EVENTS.SITE_INSTANCE_START,
		(_, siteID: string, payload: InstanceStartPayload) => {
			const { proxyUrl, hasWpCacheEnabled } = payload;

			store.dispatch(actions.setInstantReloadRunningBySiteID({ siteID, enabled: true }));
			store.dispatch(actions.setHasWpCacheEnabledBySiteID({ siteID, hasWpCacheEnabled }));
			store.dispatch(actions.setProxyUrlBySiteID({ siteID, proxyUrl }));
		},
	);

	ipcRenderer.on(
		IPC_EVENTS.SITE_INSTANCE_STOP,
		(_, siteID: string) => {
			store.dispatch(actions.setInstantReloadRunningBySiteID({ siteID, enabled: false }));
			store.dispatch(actions.setProxyUrlBySiteID({ siteID, proxyUrl: null }));
		},
	);
}
