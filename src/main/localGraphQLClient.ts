import fetch from 'cross-fetch';
import { gql } from '@apollo/client';
import { ApolloClient, createHttpLink } from '@apollo/client/core';
import { InMemoryCache } from '@apollo/client/cache';
import { setContext } from '@apollo/client/link/context';
import readGraphQLConfig from './readGraphQLConfig';


const {
	url,
	authToken,
} = readGraphQLConfig();

const httpLink = createHttpLink({
	fetch,
	uri: url,
});

const authLink = setContext((_, { headers }) => ({
	headers: {
		...headers,
		authorization: authToken ? `Bearer ${authToken}` : '',
	},
}));

export const client = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache(),
	defaultOptions: {
		watchQuery: {
			fetchPolicy: 'cache-and-network',
		},
	},
});

export const restartSiteMutation = gql`
	mutatation restartSite($siteID: ID!) {
		restartSite(id: $siteID) {

		}
	}
`;
