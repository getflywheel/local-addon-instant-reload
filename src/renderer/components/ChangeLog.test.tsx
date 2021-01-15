import React from 'react';
import { create, act } from 'react-test-renderer';
import ChangeLog, { sessionLogPlaceholderCopy } from './ChangeLog';
import type { FileChangeEntry } from '../../types';

const dummyLogItem: FileChangeEntry = {
	fileName: 'newfile.extension',
	eventType: 'add',
	timeChanged: '4:20:00 PM',
	fileSize: '121kb',
};

const commonProps = {
	changeLog: [dummyLogItem],
};

const makeTree = (props = {}) => {
	let tree;
	act(() => {
		tree = create(
			<ChangeLog {...props} />,
		);
	});
	return tree;
};

describe('ChangeLog', () => {
	it('renders contents correctly', () => {
		const tree = create(
			<ChangeLog {...commonProps} />,
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

		act(() => {
			tree.update(
				<ChangeLog
					changeLog={[
						{
							fileName: '/wp-content/themes/twentytwenty/style.css',
							timeChanged: '3:01:45 PM',
							fileSize: '121kb',
							eventType: 'change',
						},
						{
							fileName: '/wp-content/themes/twentytwenty/style.css',
							timeChanged: '4:20:00 PM',
							fileSize: '125kb',
							eventType: 'change',
						},
					]}
				/>,
			);
		});

		sessionLog = tree.root
			.findByType('ul')
			.findAllByType('li');

		expect(sessionLog.length).toBe(2);
	});
});
