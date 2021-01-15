module.exports = {
	moduleDirectories: [
		'node_modules',
		'test',
		'src',
	],
	moduleNameMapper: {
		'^@getflywheel/local/renderer': '<rootDir>/__mocks__/localRenderer.ts',
		'\.(css|sass|scss)$': 'identity-obj-proxy',
	},
	preset: 'ts-jest',
	setupFilesAfterEnv: ['jest-extended'],
	testEnvironment: 'jsdom',
};
