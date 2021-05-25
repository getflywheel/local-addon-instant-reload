import React from 'react';
import { selectors, useStoreSelector, store } from '../store/store';
import {
	TableListRow,
} from '@getflywheel/local-components';
import useActiveSiteID from './useActiveSiteID';
import { Site } from '@getflywheel/local';

interface Props {
	site: Site;
	host: string;
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const SiteOverviewHostRow = (props: Props) => {
	const { site, host } = props;
	useActiveSiteID(site.id);
	const state = store.getState();

	const proxyUrl = useStoreSelector(
		selectors.activeSiteProxyUrl,
	);

	let returnedHostValue = host;

	if (state.instantReloadRunning[site.id]) {
		returnedHostValue = proxyUrl;
	}

	// display nothing if using site domain routing
	return global.localhostRouting
		? (
			<TableListRow label="Site Host">
				{returnedHostValue}
			</TableListRow>
		)
		: (
			<></>
		);
};

export default SiteOverviewHostRow;
