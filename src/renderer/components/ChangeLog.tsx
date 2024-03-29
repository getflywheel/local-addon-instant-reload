import React from 'react';
import type { FileChangeEntry } from '../../types';
/* @ts-ignore ignore for now due to IDE's and tests not using Webpack rules/compilation to recognize this */
import styles from './ChangeLog.scss';

interface Props {
	changeLog? : FileChangeEntry[];
}

export const sessionLogPlaceholderCopy = 'Start editing to see changes logged here!';

function formatLogItem (logItem: FileChangeEntry, isLastItem: boolean): string {
	const filePathRegExp = new RegExp(/[^]*\/app\/public/);
	const {
		timeChanged,
		eventType,
		fileName,
		fileSize,
	} = logItem;

	let verb = 'Changed';
	let size = `(${fileSize})`;

	if (['unlink', 'unlinkDir'].includes(eventType)) {
		verb = 'Deleted';
		size = '';
	} else if (['add', 'addDir'].includes(eventType)) {
		verb = 'Added';
	}

	return `${isLastItem ? '>' : ''}[${timeChanged}] - ${verb} - ${fileName.replace(filePathRegExp, '')} ${size}`;
}

/* eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types */
const InstantReloadSessionLog = ({ changeLog = [] }: Props) => {
	const displayPlaceHolder = changeLog.length === 0;

	return (
		<div className={styles.sessionLogContainer}>
			<ul>
				{displayPlaceHolder
					? (<li>{sessionLogPlaceholderCopy}</li>)
					: (changeLog.map((logItem: FileChangeEntry, i: number) => (
						/**
						 * disable this rule because there is a slight chance that time stamps will match and produce
						 * elements with identical keys. Using the array index will actually help to ensure unique keys
						 * in this case.
						 */
						/* eslint-disable-next-line react/no-array-index-key */
						<li key={`${i}-${logItem.timeChanged}-${logItem.fileName}-${logItem.fileSize}`}>
							{formatLogItem(logItem, i === changeLog.length - 1)}
						</li>
					)))
				}
			</ul>
		</div>
	);
};

export default InstantReloadSessionLog;
