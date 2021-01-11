import { gql } from '@apollo/client';

export const RESTART_SITE = gql`
	mutation restartSite($siteID: ID!) {
		restartSite(id: $siteID) {
			id
			status
		}
	}
`;
