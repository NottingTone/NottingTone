export function getModulesByActivityId(activityId, modules) {
	const rets = [];
	for (const module of modules) {
		let added = false;
		for (const type_ of Object.values(module.types)) {
			for (const group of Object.values(type_)) {
				if (group.includes(activityId)) {
					rets.push(module);
					added = true;
					break;
				}
			}
			if (added) break;
		}
	}
	return rets;
};
