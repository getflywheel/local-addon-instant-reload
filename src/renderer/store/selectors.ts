import { createSelector } from '@reduxjs/toolkit';
import { store } from './store';
import type { FileChangeEntry } from '../../types';

const activeSiteID = (state) => state.activeSiteID;

const instantReloadEnabled = (state) => state.instantReloadEnabled;

const log = (state) => state.log;

// createSelector<State, State, string>(
// 	selectSelf,
// 	(state) => state.activeSiteID,
// );

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

export const selectors = {
	activeSiteID: (): string => activeSiteID(store.getState()),
	instantReloadEnabledForSite: (): boolean => instantReloadEnabledForSite(store.getState()),
	siteLog: (): FileChangeEntry[] => siteLog(store.getState()),
};
