/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { merge } = require('webpack-merge');
/* eslint-enable @typescript-eslint/no-var-requires */

const commonConf = {
	mode: process.env.NODE_ENV || 'development',
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
			{
				test: /\.s[ac]ss$/i,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {
							modules: true,
							sourceMap: true,
							importLoaders: 1,
						},
					},
					'resolve-url-loader',
					'sass-loader',
				],
			},
		],
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
					use: ['@svgr/webpack'],
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
