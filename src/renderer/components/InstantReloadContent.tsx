import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import classnames from 'classnames';
import {
	SiteInfoInnerPane,
	TableList,
	TableListRow,
	Switch,
	Text,
	FlyTooltip,
} from '@getflywheel/local-components';
import { store, actions, selectors, useStoreSelector } from '../store/store';
import { toggleAutoEnableInstantReload } from '../ipcHelpers';
import { RESTART_SITE } from '../localClient/mutations';
import { SITE_STATUS_CHANGED } from '../localClient/subscriptions';
import { GET_SITE } from '../localClient/queries';
import ChangeLog from './ChangeLog';

// import { getElTrackAttrs } from '../../../../shared/constants/trackIdElements';
// import { analyticsV2 } from '../../../../shared/helpers/analytics/AnalyticsV2API';

// import styles from './InstantReloadContent.scss';
import InformationSVG from '../assets/information.svg';
import { FileChangeEntry } from '../../types';

/**
 * @todo remove the stubbed styles object
 */
const styles = {};

interface Props {
	match: { params: { siteID: string; } };
}

export interface InstantReloadState {
	instantReloadChecked: boolean | undefined;
	isToggleDisabled: boolean;
}

export const wpCacheAlertCopy = `Live Reload works best when WP_CACHE is disabled.${' '}
You may need to disable caching plugins while using Live Reload.`;


/**
 * @todo
 * - ✅ Save change to disk
 * - ✅ Check if the site is running rather that doing the hardcode thing
 * - ✅ restart the site/instant reload
 * - add scss loader & import styles correctly
 * - ✅ get changed files from main thread into redux store and then rendering in the UI
 * - check the site for the wpCacheEnabled value
 * - Replace the site URL row daddio with the BrowserSync url if in localhost routing mode
 *
 * ______ Stretch Items ______
 * - Add anaytics and element trackers (maybe do a new ticket for this one)
 * - look into axing redux to store autoEnableInstantReload and instead query for that shit from the Local API
 * 		(could use the site query + subscribe to more)
 */


/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const InstantReloadContent = (props: Props) => {
	const { siteID } = props.match.params;

	useEffect(() => {
		store.dispatch(actions.setActiveSiteID(siteID));
	}, []);

	const instantReloadChecked = useStoreSelector(
		selectors.instantReloadEnabledForSite,
	);

	const fileLogs: FileChangeEntry[] = useStoreSelector(
		selectors.siteLog,
	);

	const [isInstantReloadToggleDisabled, disableToggle] = useState(
		false,
	);

	/**
	 * @todo handle loading / error states
	 */
	const { loading, error, data: siteQueryData } = useQuery(GET_SITE, {
		variables: { siteID },
	});

	/**
	 * @todo handle loading / error states
	 */
	const { loading: subLoading, error: subError, data: siteStatusSubscriptionData } = useSubscription(SITE_STATUS_CHANGED);

	const subscriptionResult = siteStatusSubscriptionData?.siteStatusChanged;

	const siteStatus = subscriptionResult?.id === siteID
		? subscriptionResult?.status
		: siteQueryData?.status;

	const [restartSite] = useMutation(RESTART_SITE, {
		variables: { siteID },
	});

	const toggleInstantReload = async () => {
		await toggleAutoEnableInstantReload(siteID, !instantReloadChecked);

		if (siteStatus === 'running') {
			disableToggle(true);
			await restartSite();
			disableToggle(false);
		}
	};

	return (
		<SiteInfoInnerPane>
			<TableList className={styles.instantReloadTableList}>
				<div className={styles.addPaddingTop}>
					<TableListRow className={styles.instantReloadToggleHeader} label="Instant Reload">
						<FlyTooltip
							content={
								(
									<div className={styles.tooltipContent}>
										Instant Reload watches CSS files for changes and
										<br />
										reloads them automatically in your browser
									</div>
								)
							}
							position="right"
							width="max-content"
							className={styles.instantReloadTooltip}
						>
							<div className={styles.InstantReload_InfoIcon}>
								<span>
									<InformationSVG />
								</span>
							</div>
						</FlyTooltip>
					</TableListRow>
				</div>
				<div className={styles.instantReloadText}>
					<Text className={styles.instantReloadTextContent}>
						Automatically run Instant Reload when starting this site.
					</Text>
					<Switch
						disabled={isInstantReloadToggleDisabled}
						onChange={toggleInstantReload}
						checked={instantReloadChecked}
						tiny
						flat
					/>
				</div>
				<TableListRow className={styles.lastDetectedChange} label="Session Log">
					{fileLogs.length !== 0
						? `Last detected change: ${fileLogs[fileLogs.length - 1].timeChanged}`
						: null}
				</TableListRow>
				<div
					className={classnames(
						styles.sessionLogContainer,
						{
							// [styles.logSessionActive]: instantReloadChecked === true,
							// [styles.logSessionInactive]: instantReloadChecked === false,
						},
					)}
				>
					<ChangeLog
						changeLog={fileLogs}
					/>
				</div>
				{/**
				$site?.hasWpCacheEnabled
					? (
						<div className={styles.wpCacheAlert}>
							<Text>
								{wpCacheAlertCopy}
								{' '}
								<a
									href="https://localwp.com/help-docs/getting-started-with-instant-reload/"
									{...getElTrackAttrs('InstantReloadLearnMore')}
								>
									Learn More
								</a>
							</Text>
						</div>
				)
					: null
				*/}
			</TableList>
		</SiteInfoInnerPane>
	);
};

export default InstantReloadContent;
