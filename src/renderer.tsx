
import fs from 'fs-extra';
import path from 'path';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { ipcAsync } from '@getflywheel/local/renderer';
import { store, actions } from './renderer/store/store';
import InstantReload from './renderer/components/InstantReloadContent';
import { IPC_EVENTS } from './constants';
import { client } from './renderer/localClient/localGraphQLClient';
import type { FileChangeEntry, InstanceStartPayload } from './types';

const packageJSON = fs.readJsonSync(path.join(__dirname, '../package.json'));
const addonName = packageJSON['productName'];
const addonID = packageJSON['slug'];

export default async function (context): Promise<void> {
	const { React, hooks, electron } = context;
	const { Route } = context.ReactRouter;
	const { ipcRenderer } = electron;

	const withProviders = (Component) => (props) => (
		<ApolloProvider client={client}>
			<Provider store={store}>
				<Component {...props} />
			</Provider>
		</ApolloProvider>
	);

	/**
	 * Read sites.json and set an initial state
	 */
	const initialState = await ipcAsync(IPC_EVENTS.GET_INITIAL_STATE);
	store.dispatch(actions.setInitialState(initialState));

	const InstantReloadHOC = withProviders(InstantReload);

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

	ipcRenderer.on(IPC_EVENTS.FILE_CHANGED, (_, siteID: string, fileChangeEntry: FileChangeEntry) => {
		store.dispatch(actions.fileChange({ siteID, fileChangeEntry }));
	});

	ipcRenderer.on(
		IPC_EVENTS.SITE_INSTANCE_START,
		(_, siteID, payload: InstanceStartPayload) => {
			const { proxyUrl, hasWpCacheEnabled } = payload;

			store.dispatch(actions.setHasWpCacheEnabledBySiteID({ siteID, hasWpCacheEnabled }));
			store.dispatch(actions.setProxyUrlBySiteID({ siteID, proxyUrl }));
		},
	);
}
