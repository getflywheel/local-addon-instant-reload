import React from 'react';
import classnames from 'classnames';
import { store, selectors, useStoreSelector } from '../store/store';
import CircleSVG from '../assets/circle.svg';
import useActiveSiteID from './useActiveSiteID';
/* @ts-ignore ignore for now due to IDE's and tests not using Webpack rules/compilation to recognize this */
import styles from './StatusIndicator.scss';
interface Props {
	siteID: string;
	hooks: any;
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const StatusIndicator = (props: Props) => {
	const { siteID, hooks } = props;
	const state = store.getState();

	useActiveSiteID(siteID);

	const proxyUrl = useStoreSelector(
		selectors.activeSiteProxyUrl,
	);

	// this determines the content displayed in the "Site Host" row in site overview when using localhost routing mode
	// this is added here instead of renderer.tsx because it needs access to a store via Provider wrapped component
	hooks.addFilter('SiteInfoOverview:localHostURLContent',
		(host: string) => {
			let returnedHostValue = host;

			if (state.instantReloadRunning[siteID]) {
				returnedHostValue = proxyUrl;
			}

			return returnedHostValue;
		});

	return (
		<div className={styles.InstantReload_Indicator}>
			<span className={classnames({
				[styles.InstantReload_Enabled]: !!proxyUrl,
			})}
			>
				<CircleSVG className="Circle" />
				Instant Reload
			</span>
		</div>
	);
};

export default StatusIndicator;
