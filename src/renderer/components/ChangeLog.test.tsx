
/**
 * @jest-environment <rootDir>/test/JestEnvironmentLocalRenderer.js
 */

import React from 'react';
import { create, act } from 'react-test-renderer';
import ChangeLog, { sessionLogPlaceholderCopy } from './ChangeLog';

const commonProps = {
	sessionLog: [{
		fileName: 'newfile.extension',
		timeChanged: '4:20:00 PM',
		fileSize: '121kb',
	}],
};

const makeTree = (props = {}) => {
	let tree;
	act(() => {
		tree = create(
			<ChangeLog
				/* eslint-disable react/jsx-props-no-spreading */
				{...props}
				/* eslint-enable react/jsx-props-no-spreading */
			/>,
		);
	});
	return tree;
};

describe('ChangeLog', () => {
	it('renders contents correctly', () => {
		const tree = create(
			<ChangeLog
				/* eslint-disable react/jsx-props-no-spreading */
				{...commonProps}
				/* eslint-enable react/jsx-props-no-spreading */
			/>,
		).toJSON();

		expect(tree).toMatchSnapshot();
	});

	it('renders empty array message correctly', () => {
		const tree = makeTree({ sessionLog: [] });
		expect(
			tree.root.findByType('ul').findByType('li').children,
		).toEqual([sessionLogPlaceholderCopy]);
	});

	it('correctly adds a log line', () => {
		const tree = makeTree(commonProps);
		let sessionLog = tree.root
			.findByType('ul')
			.findAllByType('li');

		expect(sessionLog.length).toBe(1);

		const newLogLine = [
			{ fileName: '/wp-content/themes/twentytwenty/style.css', timeChanged: '3:01:45 PM', fileSize: '121kb' },
			{ fileName: '/wp-content/themes/twentytwenty/style.css', timeChanged: '4:20:00 PM', fileSize: '125kb' },
		];
		act(() => {
			tree.update(
				<ChangeLog
					/* eslint-disable react/jsx-props-no-spreading */
					{...{ sessionLog: newLogLine }}
					/* eslint-enable react/jsx-props-no-spreading */
				/>,
			);
		});

		sessionLog = tree.root
			.findByType('ul')
			.findAllByType('li');

		expect(sessionLog.length).toBe(2);
	});
});
