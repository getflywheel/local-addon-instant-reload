import { useSelector, TypedUseSelectorHook, PayloadAction } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { FileChangeEntry } from '../../types';

export { selectors } from './selectors';

type LogSlice = { [siteID: string]: FileChangeEntry[] };

type InstantReloadAutoEnabledSlice = { [siteID: string]: boolean };

type InstantReloadRunningSlice = { [siteID: string]: boolean };

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

/**
 * Manages whether Instant Reload is auto-enabled and will start when the site starts
 * Keyed by site id
 */
const instantReloadAutoEnabledSlice = createSlice({
	name: 'instantReloadAutoEnabled',
	initialState: {} as InstantReloadAutoEnabledSlice,
	reducers: {
		setInstantReloadAutoEnabledInitialState: (state, action: PayloadAction<InstantReloadAutoEnabledSlice>) => {
			state = action.payload;
			return state;
		},
		setInstantReloadAutoEnabledBySiteID: (state, action: PayloadAction<{ siteID: string, enabled: boolean }>) => {
			const { siteID, enabled } = action.payload;
			state[siteID] = enabled;
			return state;
		},
		toggleInstantReloadAutoEnabledBySiteID: (state, action: PayloadAction<string>) => {
			const siteID = action.payload;
			const enabled = !state[siteID];
			state[siteID] = enabled;

			return state;
		},
	},
});


/**
 * Manages whether Instant Reload has an active instance running
 * Keyed by site id
 */
const instantReloadRunningSlice = createSlice({
	name: 'instantReloadRunning',
	initialState: {} as InstantReloadRunningSlice,
	reducers: {
		setInstantReloadRunningInitialState: (state, action: PayloadAction<InstantReloadAutoEnabledSlice>) => {
			state = action.payload;
			return state;
		},
		setInstantReloadRunningBySiteID: (state, action: PayloadAction<{ siteID: string, enabled: boolean }>) => {
			const { siteID, enabled } = action.payload;
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
		setProxyUrlInitialState: (state, action: PayloadAction<ProxyUrlSlice>) => {
			state = action.payload;
			return state;
		},
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
		instantReloadAutoEnabled: instantReloadAutoEnabledSlice.reducer,
		instantReloadRunning: instantReloadRunningSlice.reducer,
		log: logSlice.reducer,
		hasWpCacheEnabled: hasWpCacheEnabledSlice.reducer,
		proxyUrl: proxyUrlSlice.reducer,
	},
});

export const actions = {
	...activeSiteIDSlice.actions,
	...instantReloadAutoEnabledSlice.actions,
	...instantReloadRunningSlice.actions,
	...logSlice.actions,
	...hasWpCacheEnabledSlice.actions,
	...proxyUrlSlice.actions,
};

export type State = ReturnType<typeof store.getState>;
export const useStoreSelector = useSelector as TypedUseSelectorHook<State>;
