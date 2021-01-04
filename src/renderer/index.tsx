import React, { useEffect, ReactNode } from 'react';
import { store, actions, selectors, useStoreSelector } from './store/store';


interface Props {
	match: { params: { siteID: string; } };
}

const InstantReload = (props: Props): ReactNode => {
	const { siteID } = props.match.params;

	const activeSiteID = useStoreSelector(selectors.activeSiteID);

	useEffect(() => {
		store.dispatch(actions.setActiveSiteID(siteID));
	}, [siteID]);

	return (
		<div>
			The current site id on props is {siteID}
			<br />
			The current site id in the store is {activeSiteID}
		</div>
	);
};

export default InstantReload;
