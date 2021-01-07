import fs from 'fs-extra';

interface GraphQLConfig {
	port: string;
	authToken: string;
	url: string;
	subscriptionUrl: string;
}

export default function readGraphQLConfig (): GraphQLConfig {
	let config;
	try {
		const configString = fs.readFileSync(
			'/Users/mattehlinger/Library/Application Support/Local/graphql-connection-info.json',
			'utf8',
		);

		config = JSON.parse(configString);
	} catch(err) {
		// probably no file found, so blow on by for now
	}

	return config;
}
