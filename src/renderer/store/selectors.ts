import { createSelector } from '@reduxjs/toolkit';
import { store } from './store';
import type { FileChangeEntry } from '../../types';

const activeSiteID = (state) => state.activeSiteID;

const instantReloadAutoEnabled = (state) => state.instantReloadAutoEnabled;

const instantReloadRunning = (state) => state.instantReloadRunning;

const log = (state) => state.log;

const hasWpCacheEnabled = (state) => state.hasWpCacheEnabled;

const proxyUrl = (state) => state.proxyUrl;

const instantReloadAutoEnabledForSite = createSelector(
	activeSiteID,
	instantReloadAutoEnabled,
	(activeSiteID, instantReloadAutoEnabled) => instantReloadAutoEnabled[activeSiteID],
);

const instantReloadRunningForSite = createSelector(
	activeSiteID,
	instantReloadRunning,
	(activeSiteID, instantReloadRunning) => {
		const res = instantReloadRunning[activeSiteID];
		return res;
	},
);

const siteLog = createSelector(
	activeSiteID,
	log,
	(activeSiteID, log) => log[activeSiteID] || [],
);

const activeSiteHasWpCacheEnabled = createSelector(
	activeSiteID,
	hasWpCacheEnabled,
	(activeSiteID, hasWpCacheEnabled) => hasWpCacheEnabled[activeSiteID],
);

const activeSiteProxyUrl = createSelector(
	activeSiteID,
	proxyUrl,
	(activeSiteID, proxyUrl) => proxyUrl[activeSiteID],
);

export const selectors = {
	activeSiteID: (): string => activeSiteID(store.getState()),
	instantReloadAutoEnabledForSite: (): boolean => instantReloadAutoEnabledForSite(store.getState()),
	instantReloadRunningForSite: (): boolean => instantReloadRunningForSite(store.getState()),
	siteLog: (): FileChangeEntry[] => siteLog(store.getState()),
	activeSiteHasWpCacheEnabled: (): boolean => activeSiteHasWpCacheEnabled(store.getState()),
	activeSiteProxyUrl: (): string | null => activeSiteProxyUrl(store.getState()),
};
