import { ipcAsync } from '@getflywheel/local/renderer';
import { IPC_EVENTS } from '../constants';
import { store, actions } from './store/store';

export const toggleAutoEnableInstantReload = async (siteID: string, enabled: boolean): Promise<void> => {
	store.dispatch(actions.setInstantReloadEnabledBySiteID({ siteID, enabled }));

	/**
	 * Save autoenabled Instant Reload setting to disk
	 */
	const result = ipcAsync(IPC_EVENTS.SET_AUTO_ENABLE_INSTANT_RELOAD, siteID, enabled);

	/**
	 * revert the redux store to the previous value if the write to disk fails for any reason
	 */
	if (!result) {
		store.dispatch(actions.setInstantReloadEnabledBySiteID({ siteID, enabled: !enabled }));
	}
};
