import fs from 'fs-extra';
import path from 'path';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import type { Site, SiteJSON } from '@getflywheel/local';
import { ipcAsync } from '@getflywheel/local/renderer';
import { store, actions } from './renderer/store/store';
import InstantReload from './renderer/components/InstantReloadContent';
import { IPC_EVENTS } from './constants';
import { client } from './renderer/localClient/localGraphQLClient';
import SiteOverviewDomainRow from './renderer/components/SiteOverviewDomainRow';
import type { FileChangeEntry, InstanceStartPayload } from './types';


const packageJSON = fs.readJsonSync(path.join(__dirname, '../package.json'));
const addonName = packageJSON.productName;
const addonID = packageJSON.slug;

const withProviders = (Component) => (props) => (
	<ApolloProvider client={client}>
		<Provider store={store}>
			<Component {...props} />
		</Provider>
	</ApolloProvider>
);

export default async function (context): Promise<void> {
	const { React, ReactRouter, hooks, electron } = context;
	const { Route } = ReactRouter;
	const { ipcRenderer } = electron;

	const { autoEnableInstantReload, proxyUrl } = await ipcAsync(IPC_EVENTS.GET_INITIAL_STATE);
	store.dispatch(actions.setInstantReloadEnabledInitialState(autoEnableInstantReload));
	store.dispatch(actions.setProxyUrlInitialState(proxyUrl));

	const InstantReloadHOC = withProviders(InstantReload);
	const SiteOverviewDomainRowHOC = withProviders(SiteOverviewDomainRow);

	// Create the route/page of content that will be displayed when the menu option is clicked
	hooks.addContent('routesSiteInfo', () => (
		<Route
			key={`${addonID}-addon`}
			path={`/main/site-info/:siteID/${addonID}`}
			render={(props) => <InstantReloadHOC {...props} />}
		/>
	));

	// Add menu option within the site menu bar
	hooks.addFilter('siteInfoMoreMenu', (menu, site) => {
		menu.push({
			label: `${addonName}`,
			enabled: true,
			click: () => {
				context.events.send('goToRoute', `/main/site-info/${site.id}/${addonID}`);
			},
		});

		return menu;
	});

	hooks.addContent('SiteInfoOverview_TableList', (site: Site) => (
		<SiteOverviewDomainRowHOC
			site={site}
		/>
	));

	hooks.addFilter(
		'openSite:url',
		(url: string, site: SiteJSON) => {
			const state = store.getState();

			/* @ts-ignore ignoring the next line since TS doesn't know about the presence of localhostRouting */
			if (global.localhostRouting && state.instantReloadEnabled[site.id]) {
				return state.proxyUrl[site.id];
			}

			return url;
		},
	);

	ipcRenderer.on(IPC_EVENTS.FILE_CHANGED, (_, siteID: string, fileChangeEntry: FileChangeEntry) => {
		store.dispatch(actions.fileChange({ siteID, fileChangeEntry }));
	});

	ipcRenderer.on(
		IPC_EVENTS.SITE_INSTANCE_START,
		(_, siteID: string, payload: InstanceStartPayload) => {
			const { proxyUrl, hasWpCacheEnabled } = payload;

			store.dispatch(actions.setHasWpCacheEnabledBySiteID({ siteID, hasWpCacheEnabled }));
			store.dispatch(actions.setProxyUrlBySiteID({ siteID, proxyUrl }));
		},
	);

	ipcRenderer.on(
		IPC_EVENTS.SITE_INSTANCE_STOP,
		(_, siteID: string) => {
			store.dispatch(actions.setProxyUrlBySiteID({ siteID, proxyUrl: null }));
		},
	);
}
