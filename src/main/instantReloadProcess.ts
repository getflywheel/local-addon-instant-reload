import path from 'path';
import fs from 'fs';
import getPort from 'get-port';
/* @ts-ignore */
import { addProtocol } from '@getflywheel/local';
// import browserSync from '@getflywheel/local-browsersync';
const browserSync = require('@getflywheel/local-browsersync');
import type BrowserSyncInstance from '@getflywheel/local-browsersync';
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

function processSafeSend (name) {
	return (payload?) => {
		process.send?.({ name, payload });
	};
}

const handleCreate = async (payload) => {
	instantReloadInstance = browserSync.create(payload.siteID);

	// set a random port to init the Instant Reload session on if we are running tests.
	let testInitOptions = {};

	if (typeof process.env.JEST_WORKER_ID !== 'undefined') {
		testInitOptions = { port: await getPort() };
	}

	const instantReloadUrl: string = await new Promise((resolve) => {
		instantReloadInstance.init({
			proxy: {
				target: `http://127.0.0.1:${payload.httpPort}`,
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
						// sets response header 'transfer-encoding' to undefined when running integration tests
						// this header was causing parse errors when the proxy URL was called by fetch()
						if (typeof process.env.JEST_WORKER_ID !== 'undefined') {
							// eslint-disable-next-line no-param-reassign
							proxyRes.headers['transfer-encoding'] = undefined;
						}
					},
				],
			},
			rewriteRules: [
				// For some oddball reason, link rewrites aren't getting handled automatically when in localhost
				// routing mode, so we must do so manually
				{
					match: new RegExp(`localhost:${payload.httpPort}`, 'g'),
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
				domain(options) {
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
