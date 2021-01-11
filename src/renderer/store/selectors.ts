import { createSelector } from '@reduxjs/toolkit';
import { store, State } from './store';

const selectSelf = () => store.getState();

const activeSiteID = (state) => state.activeSiteID;

const instantReloadEnabled = (state) => state.instantReloadEnabled;

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

export const selectors = {
	activeSiteID: (): string => activeSiteID(store.getState()),
	instantReloadEnabledForSite: (): boolean => instantReloadEnabledForSite(store.getState()),
};
