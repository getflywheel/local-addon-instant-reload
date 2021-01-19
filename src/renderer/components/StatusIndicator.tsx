import React from 'react';
import classnames from 'classnames';
import { selectors, useStoreSelector } from '../store/store';
import CircleSVG from '../assets/circle.svg';
/* @ts-ignore ignore for now due to IDE's and tests not using Webpack rules/compilation to recognize this */
import styles from './StatusIndicator.scss';


/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const StatusIndidcator = () => {
	const proxyUrl = useStoreSelector(
		selectors.activeSiteProxyUrl,
	);

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

export default StatusIndidcator;
