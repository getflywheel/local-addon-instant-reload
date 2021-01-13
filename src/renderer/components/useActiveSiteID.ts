import { useEffect } from 'react';
import { store, actions } from '../store/store';

const useActiveSiteID = (siteID: string): void => useEffect(() => {
	store.dispatch(actions.setActiveSiteID(siteID));
}, [siteID]);

export default useActiveSiteID;
