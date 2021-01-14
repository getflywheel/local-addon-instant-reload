import React from 'react';
import { TableListRow } from '@getflywheel/local-components';
import useActiveSiteID from './useActiveSiteID';
import { selectors, useStoreSelector } from '../store/store';
import type { Site } from '@getflywheel/local';

interface Props {
	site: Site;
	match: { params: { siteID: string; } };
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const SiteOverviewDomainRow = (props: Props) => {
	useActiveSiteID(props.site.id);

	const proxyUrl = useStoreSelector(
		selectors.activeSiteProxyUrl,
	);

	if (!proxyUrl) {
		return null;
	}

	return (
		<TableListRow
			label="Instant Reload Host"
			selectable
		>
			{proxyUrl}
		</TableListRow>
	);
};

export default SiteOverviewDomainRow;
