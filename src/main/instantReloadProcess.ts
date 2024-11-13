import path from 'path';
import fs from 'fs';
import getPort from 'get-port';
import bs from 'browser-sync';
import type { BrowserSyncInstance } from 'browser-sync';
import { INSTANT_RELOAD_EVENTS } from '../constants';

interface FileChangeResponse {
	file: string;
	event: string;
	timeChanged: string;
	siteID: string;
	fileSize: string;
}

let instantReloadInstance: BrowserSyncInstance;

const watchFileExtensions = [
	'css',
	'jpg',
	'jpeg',
	'gif',
	'png',
];


/**
 * Appends http or http to the beginning of a url if a protocol does not already exist on the url
 *
 * @param url string
 * @param protocol string
 */
export function addProtocol (url: string, https?: boolean): string {
	const protocolMatcher = /https?:\/\//g;
	if (url.match(protocolMatcher)) {
		return url;
	}

	const protocol = https ? 'https' : 'http';

	return `${protocol}://${url}`;
}

function processSafeSend (name) {
	return (payload?) => {
		process.send?.({ name, payload });
	};
}

const handleCreate = async (payload) => {
	instantReloadInstance = bs.create(payload.siteID);

	// set a random port to init the Instant Reload session on if we are running tests.
	let testInitOptions = {};

	if (typeof process.env.JEST_WORKER_ID !== 'undefined') {
		testInitOptions = { port: await getPort() };
	}

	const instantReloadUrl: string = await new Promise((resolve) => {
		instantReloadInstance.init({
			logPrefix: 'Instant Reload',
			// @ts-expect-error: Temporarily ignoring this error until
			// upstream fix is available:
			//     https://github.com/BrowserSync/browser-sync/pull/2093
			notify: {
				styles: {
					display: 'none',
					padding: '15px',
					fontFamily: 'sans-serif',
					position: 'fixed',
					fontSize: '1em',
					zIndex: 1000000,
					right: 0,
					top: 0,
					borderBottomLeftRadius: '5px',
					backgroundColor: '#419564',
					margin: 0,
					color: 'white',
					textAlign: 'center',
					pointerEvents: 'none',
				},
			},
			proxy: {
				target: `http://localhost:${payload.httpPort}`,
				proxyReq: [
					/**
					 * Site Domain routing mode requires the host header be set.
					 * Otherwise, the request won't resolve and will fail
					 */
					(proxyReq, incomingMsg) => {
						const host = incomingMsg?.headers?.host;

						/**
						 * This serves as a fallback in the case that the host header doesn't exist.
						 * One scenario this seems to happen in is when an asset that is at the root domain
						 * is requested from a subdomain on a multisite
						 */
						if (!host) {
							return proxyReq.setHeader('Host', payload.host);
						}

						/**
						 * We want to ensure that the site host is used in localhost routing mode because
						 * using the host header will use the site port and not the BrowserSync proxy port with
						 * will cause all requests to the BrowserSync proxy to get redirected to the site directly
						 */
						const { hostname } = new URL(addProtocol(host));

						if (hostname === 'localhost' || hostname === '127.0.0.1') {
							return proxyReq.setHeader('Host', payload.host);
						}

						return proxyReq.setHeader('Host', host);
					},
				],
				proxyRes: [
					(proxyRes) => {
						delete proxyRes.headers['transfer-encoding'];
					},
				],
			},
			rewriteRules: [
				// For some oddball reason, link rewrites aren't getting handled automatically when in localhost
				// routing mode, so we must do so manually
				{
					match: new RegExp(`localhost:${payload.httpPort}`, 'g'),
					/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
					fn: (req, res, match) => {
						const localUrl = instantReloadInstance.getOption('urls').get('local');
						const { hostname, port } = new URL(localUrl);
						return `${hostname}:${port}`;
					},
				},
			],
			...testInitOptions,
			ghostMode: false,
			ui: false,
			/**
			 * Tell Browsersync to simply use the current page hostname (from location.hostname) and to not use
			 * a port unless the hostname is localhost.
			 *
			 * This enables compatibility with Live Links Pro.
			 *
			 * Inspiration: https://github.com/BrowserSync/browser-sync/issues/788#issuecomment-298880372
			 */
			socket: {
				domain (options) {
					return [
						"'",
						'location.protocol',
						"'//'",
						'location.hostname',
						`(/localhost/.test(location.hostname) ? ':${options.get('port')}' : '')`,
						"'",
					].join(' + ');
				},
			},
			open: false,
			watchEvents: ['add', 'change'],
		}, () => {
			resolve(instantReloadInstance.getOption('urls').get('local'));
		});
	});

	return instantReloadUrl;
};

const handleWatchFiles = async (payload) => {
	if (!instantReloadInstance) {
		return;
	}

	/**
	 * On Windows, a Site's webRoot path contains backslashes. Since backslashes are not valid in glob patterns
	 * they have to be stripped out and replaced with forward slashes
	 */
	const webRootPieces = payload.webRoot.split(path.sep);

	const fileWatchPatterns = watchFileExtensions.map(
		(extension) => [...webRootPieces, 'wp-content', '?(themes|plugins)', '**', `*.${extension}`].join('/'),
	);

	const chokidarOpts = {
		ignored: /(\/vendor\/|\/node_modules\/)/g,
		ignoreInitial: true,
	};

	const fsWatcher = instantReloadInstance.watch(
		fileWatchPatterns,
		chokidarOpts,
		(event, file) => {
			instantReloadInstance.reload(file);

			const response: FileChangeResponse = {
				file,
				event,
				timeChanged: new Date().toLocaleTimeString(),
				siteID: payload.siteID,
				fileSize: '0kb',
			};

			/**
			 * Calls to statSync might fail on unlink or unlinkDir events since the file might not exist.
			 * Wrapping this in a try/catch allows us to silently catch errors and keep on moving if a file happens
			 * to not exist anymore
			 */
			try {
				const { size } = fs.statSync(file);
				response.fileSize = `${Math.round((size / 1000))}kb`;
			} catch (err) {
				/**
				 * Errors are likely caused unlink or unlinkDir events and files not existing
				 * Silently ignore these warnings as they are pretty loud and not necessarily helpful
				 * in this case
				 */
			}

			processSafeSend(INSTANT_RELOAD_EVENTS.FILE_CHANGED)(response);
		},
	);

	await new Promise<void>((resolve) => {
		fsWatcher.on('ready', () => {
			resolve();

			// Reload the site to ensure that the browser sync websocket connection is made and all files are up to date
			instantReloadInstance?.reload();
		});
	});
};

const handleDestroy = () => {
	instantReloadInstance.exit();
};

/**
 * Handle messages from the main thread. You can use reply and pass it an arbitrary argument that it will pass back
 * to the main thread on the same named message channel
 */
process.on('message', async (message) => {
	const { name, payload } = message;

	const reply = processSafeSend(name);

	/**
	 * Each handler function should return the value that reply is expected to reply back to the main thread with
	 */
	switch (name) {
		case INSTANT_RELOAD_EVENTS.CREATE:
			reply(await handleCreate(payload));
			break;

		case INSTANT_RELOAD_EVENTS.WATCH:
			reply(await handleWatchFiles(payload));
			break;

		case INSTANT_RELOAD_EVENTS.DESTROY:
			reply(handleDestroy());
			break;

		default:
			reply();
	}
});
