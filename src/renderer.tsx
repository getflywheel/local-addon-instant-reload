
import fs from 'fs-extra';
import path from 'path';
import { Provider } from 'react-redux';
import { store } from './renderer/store/store';
import InstantReload from './renderer/index';

const packageJSON = fs.readJsonSync(path.join(__dirname, '../package.json'));
const addonName = packageJSON['productName'];
const addonID = packageJSON['slug'];

export default function (context) {
	const { React, hooks } = context;
	const { Route } = context.ReactRouter;

	const withStoreProvider = (Component) => (props) => (
		<Provider store={store}>
			<Component {...props} />
		</Provider>
	);

	const InstantReloadHOC = withStoreProvider(InstantReload);

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
}
