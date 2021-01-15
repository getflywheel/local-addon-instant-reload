module.exports = {
	moduleNameMapper: {
		'^@getflywheel/local/renderer': '<rootDir>/test/mockLocalRenderer.ts',
		'\\.(css|sass|scss)$': '<rootDir>/test/CSSStub.ts',
	},
	preset: 'ts-jest',
	setupFilesAfterEnv: ['jest-extended'],
	testEnvironment: 'jsdom',
};
