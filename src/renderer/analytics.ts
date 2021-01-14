import { ipcRenderer } from 'electron';
import type { GenericObject } from '../types';

const prefix = 'v2_instant_reload_toggle_';

export const ANALYTIC_EVENTS = {
	TOGGLE_ON: `${prefix}on`,
	TOGGLE_OFF: `${prefix}off`,
} as const;

type AnalyticsEventsKeys = keyof typeof ANALYTIC_EVENTS;
export type AnalyticsEvent = typeof ANALYTIC_EVENTS[AnalyticsEventsKeys];

export const reportAnalytics = (eventName: AnalyticsEvent, additionalProperties?: GenericObject): void => {
	const channel = 'analyticsV2:trackEvent';
	ipcRenderer.send(channel, eventName, additionalProperties);
};
