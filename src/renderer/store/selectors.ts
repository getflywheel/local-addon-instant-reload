import { createSelector } from '@reduxjs/toolkit';
import { store } from './store';
import type { FileChangeEntry } from '../../types';

const activeSiteID = (state) => state.activeSiteID;

const instantReloadEnabled = (state) => state.instantReloadEnabled;

const log = (state) => state.log;

const hasWpCacheEnabled = (state) => state.hasWpCacheEnabled;

const proxyUrl = (state) => state.proxyUrl;

const instantReloadEnabledForSite = createSelector(
	activeSiteID,
	instantReloadEnabled,
	(activeSiteID, instantReloadEnabled) => {
		const res = instantReloadEnabled[activeSiteID];
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
	instantReloadEnabledForSite: (): boolean => instantReloadEnabledForSite(store.getState()),
	siteLog: (): FileChangeEntry[] => siteLog(store.getState()),
	activeSiteHasWpCacheEnabled: (): boolean => activeSiteHasWpCacheEnabled(store.getState()),
	activeSiteProxyUrl: (): string | null => activeSiteProxyUrl(store.getState()),
};
