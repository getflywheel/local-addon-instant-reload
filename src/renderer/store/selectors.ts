import { createSelector } from '@reduxjs/toolkit';
import { store, State } from './store';

const selectSelf = () => store.getState();

export const activeSiteID = createSelector<State, State, string>(
	selectSelf,
	(state) => state.activeSiteID,
);

export const selectors = {
	activeSiteID: (): string => activeSiteID(store.getState()),
};
