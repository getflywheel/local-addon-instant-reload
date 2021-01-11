import { useSelector, TypedUseSelectorHook, PayloadAction } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { FileChangeEntry } from '../../types';

export { selectors } from './selectors';

type LogSlice = { [siteID: string]: FileChangeEntry[] };

type InstantReloadEnabledSlice = { [siteID: string]: boolean };

const activeSiteIDSlice = createSlice({
	name: 'activeSiteID',
	initialState: null,
	reducers: {
		setActiveSiteID: (state, action: PayloadAction<string>) => {
			state = action.payload;
			return state;
		},
	},
});

const instantReloadEnabledSlice = createSlice({
	name: 'instantReloadEnabled',
	initialState: {} as InstantReloadEnabledSlice,
	reducers: {
		setInitialState: (state, action: PayloadAction<InstantReloadEnabledSlice>) => {
			state = action.payload;
			return state;
		},
		setInstantReloadEnabledBySiteID: (state, action: PayloadAction<{ siteID: string, enabled: boolean }>) => {
			const { siteID, enabled } = action.payload;
			state[siteID] = enabled;
			return state;
		},
		toggleInstantReloadBySiteID: (state, action: PayloadAction<string>) => {
			const siteID = action.payload;
			const enabled = !state[siteID];
			state[siteID] = enabled;

			return state;
		},
	},
});

/**
 * This slice will be used to manage logs of file change events and will be
 * keyed by site id
 */
const logSlice = createSlice({
	name: 'log',
	initialState: {} as LogSlice,
	reducers: {
		fileChange: (state, action: PayloadAction<{ siteID: string, fileChangeEntry: FileChangeEntry }>) => {
			const { siteID, fileChangeEntry } = action.payload;
			state[siteID].push(fileChangeEntry);

			return state;
		},
	},
});

export const store = configureStore({
	reducer: {
		activeSiteID: activeSiteIDSlice.reducer,
		instantReloadEnabled: instantReloadEnabledSlice.reducer,
		log: logSlice.reducer,
	},
});

export const actions = {
	...activeSiteIDSlice.actions,
	...instantReloadEnabledSlice.actions,
	...logSlice.actions,
};

export type State = ReturnType<typeof store.getState>;
export const useStoreSelector = useSelector as TypedUseSelectorHook<State>;
