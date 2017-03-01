export const defaultSettings = {
	campus: 'unnc',
	building: 'legacy',    // unnc only
	module: 'full',
	alarm: 'no',
};

export function mergeSettings(config) {
	return {
		...defaultSettings,
		...config,
	};
};
