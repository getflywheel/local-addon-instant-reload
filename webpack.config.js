/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { merge } = require('webpack-merge');
/* eslint-enable @typescript-eslint/no-var-requires */


const commonConf = {
	context: path.resolve(__dirname, 'src'),
	externals: [
		'@getflywheel/local/renderer',
		'@getflywheel/local/main',
		'@getflywheel/local',
		'react',
		'@getflywheel/local-components',
		'react-dom',
		'react-router-dom',
	],
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				exclude: [/node_modules/],
				use: [
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							configFile: 'tsconfig.json',
							onlyCompileBundledFiles: true,
						},
					},
				],
			},
		],
	},
	node: {
		fs: 'empty',
		/* eslint-disable-next-line camelcase */
		child_process: 'empty',
		__dirname: false,
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'lib'),
		libraryTarget: 'commonjs2',
	},
};

const configs = [
	{
		entry: {
			renderer: './renderer.tsx',
		},
		module: {
			rules: [
				{
					test: /\.svg$/,
					issuer: {
						test: /\.[tj]sx?$/,
					},
					use: [
						'babel-loader',
						{
							loader: 'react-svg-loader',
							options: {
								svgo: {
									plugins: [
										{
											inlineStyles: { onlyMatchedOnce: false },
										},
									],
								},
							},
						},
					],
				},
			],
		},
		target: 'electron-renderer',
	},
	{
		entry: {
			main: './main.ts',
			instantReloadProcess: './main/instantReloadProcess.ts',
		},
		target: 'electron-main',
		externals: [nodeExternals()],
	},
].map((config) => merge(commonConf, config));

module.exports = configs;
