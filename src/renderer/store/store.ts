import { useSelector, TypedUseSelectorHook, PayloadAction } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { FileChangeEntry } from '../../types';
import { stringify } from 'querystring';

export { selectors } from './selectors';

type LogSlice = { [siteID: string]: FileChangeEntry[] };

type InstantReloadEnabledSlice = { [siteID: string]: boolean };

type HasWpCacheEnabledSlice = { [siteID: string]: boolean };

type ProxyUrlSlice = { [siteID: string]: string };

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

			if (!state[siteID]) {
				state[siteID] = [];
			}

			state[siteID].push(fileChangeEntry);

			return state;
		},
	},
});

const hasWpCacheEnabledSlice = createSlice({
	name: 'hasWpCacheEnabled',
	initialState: {} as HasWpCacheEnabledSlice,
	reducers: {
		setHasWpCacheEnabledBySiteID: (state, action: PayloadAction<{ siteID: string, hasWpCacheEnabled: boolean }>) => {
			const { siteID, hasWpCacheEnabled } = action.payload;

			state[siteID] = hasWpCacheEnabled;

			return state;
		},
	},
});

const proxyUrlSlice = createSlice({
	name: 'proxyUrl',
	initialState: {} as ProxyUrlSlice,
	reducers: {
		setProxyUrlBySiteID: (state, action: PayloadAction<{ activeSiteIDSlice, proxyUrl: string }>) => {
			const { siteID, proxyUrl } = action.payload;

			state[siteID] = proxyUrl;

			return state;
		},
	},
});

export const store = configureStore({
	reducer: {
		activeSiteID: activeSiteIDSlice.reducer,
		instantReloadEnabled: instantReloadEnabledSlice.reducer,
		log: logSlice.reducer,
		hasWpCacheEnabled: hasWpCacheEnabledSlice.reducer,
		proxyUrl: proxyUrlSlice.reducer,
	},
});

export const actions = {
	...activeSiteIDSlice.actions,
	...instantReloadEnabledSlice.actions,
	...logSlice.actions,
	...hasWpCacheEnabledSlice.actions,
	...proxyUrlSlice.actions,
};

export type State = ReturnType<typeof store.getState>;
export const useStoreSelector = useSelector as TypedUseSelectorHook<State>;
