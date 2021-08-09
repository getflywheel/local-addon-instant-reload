import React, { useState } from 'react';
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
import { selectors, useStoreSelector } from '../store/store';
import { toggleAutoEnableInstantReload } from '../ipcHelpers';
import { RESTART_SITE } from '../localClient/mutations';
import { SITE_STATUS_CHANGED } from '../localClient/subscriptions';
import { GET_SITE } from '../localClient/queries';
import ChangeLog from './ChangeLog';
import useActiveSiteID from './useActiveSiteID';
import type { FileChangeEntry } from '../../types';
import { ANALYTIC_EVENTS, reportAnalytics } from '../analytics';
import type { Site } from '@getflywheel/local';
import styles from './InstantReloadContent.scss';
import InformationSVG from '../assets/information.svg';

interface Props {
	site: Site;
}

export const wpCacheAlertCopy = `Live Reload works best when WP_CACHE is disabled.${' '}
You may need to disable caching plugins while using Live Reload.`;

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const InstantReloadContent = (props: Props) => {
	const siteID = props?.site?.id;

	useActiveSiteID(siteID);

	const instantReloadChecked = useStoreSelector(
		selectors.instantReloadAutoEnabledForSite,
	);

	const fileLogs: FileChangeEntry[] = useStoreSelector(
		selectors.siteLog,
	);

	const hasWpCacheEnabled: boolean = useStoreSelector(
		selectors.activeSiteHasWpCacheEnabled,
	);

	const [isInstantReloadToggleDisabled, disableToggle] = useState(
		false,
	);

	const { data: siteQueryData } = useQuery(GET_SITE, {
		variables: { siteID },
	});

	const { data: siteStatusSubscriptionData } = useSubscription(SITE_STATUS_CHANGED);

	const subscriptionResult = siteStatusSubscriptionData?.siteStatusChanged;

	const siteStatus = subscriptionResult?.id === siteID
		? subscriptionResult?.status
		: siteQueryData?.site.status;

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

		reportAnalytics(
			instantReloadChecked ? ANALYTIC_EVENTS.TOGGLE_ON : ANALYTIC_EVENTS.TOGGLE_OFF,
		);
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
							[styles.logSessionActive]: instantReloadChecked === true,
							[styles.logSessionInactive]: instantReloadChecked === false,
						},
					)}
				>
					<ChangeLog
						changeLog={fileLogs}
					/>
				</div>
				{hasWpCacheEnabled
					? (
						<div className={styles.wpCacheAlert}>
							<Text>
								{wpCacheAlertCopy}
								{' '}
								<a
									href="https://localwp.com/help-docs/getting-started-with-instant-reload/"
								>
									Learn More
								</a>
							</Text>
						</div>
					)
					: null
				}
			</TableList>
		</SiteInfoInnerPane>
	);
};

export default InstantReloadContent;
