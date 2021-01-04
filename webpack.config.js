/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
	context: path.resolve(__dirname, 'src'),
	entry: {
		renderer: './renderer.tsx',
		main: './main.ts',
	},
	externals: [
		'@getflywheel/local/renderer',
		'@getflywheel/local/main',
		'react',
		'@getflywheel/local-components',
		'react-dom',
		'react-router-dom',
	],
	devtool: 'source-map',
	target: 'electron-renderer',
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
						},
					},
				],
			},
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
