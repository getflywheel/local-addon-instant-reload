import { useSelector, TypedUseSelectorHook, PayloadAction } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';

export { selectors } from './selectors';

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
 * This slice will be used to manage logs of file change events and will be
 * keyed by site id
 */
const logSlice = createSlice({
	name: 'log',
	initialState: {},
	reducers: {},
});

export const store = configureStore({
	reducer: {
		activeSiteID: activeSiteIDSlice.reducer,
		log: logSlice.reducer,
	},
});

export const actions = {
	...activeSiteIDSlice.actions,
	...logSlice.actions,
};

export type State = ReturnType<typeof store.getState>;
export const useStoreSelector = useSelector as TypedUseSelectorHook<State>;
