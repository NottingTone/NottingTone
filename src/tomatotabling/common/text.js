const ABBRS = {
	"and": "&",
	"for": "4",
	"to": "2",
	"in": "in"
};

export function getAcronym(module) {
	return module
		.split(/\b\s*/)
		.map(x => ABBRS[x] ? ABBRS[x] : x.slice(0, 1))	// '' => ''; 'a' ==> 'a'; 'ab' ==> 'a'
		.join('');
};

export function getModuleText(settings, module) {
	switch (settings.module) {
	case 'code':
		return module.code;
	case 'acronym':
		return getAcronym(module.name);
	default:
		return module.name;
	}
};

export function getRoomText(settings, room) {
	if (settings.building === 'legacy') {
		return room.alias;
	}
	return room.name;
};

export function getWeeksText(weeks) {
	weeks = [...weeks].sort((a, b) => a - b);
	let ranges = [];
	let last, rangeStart;
	for (const week of weeks) {
		if (!last) {
			rangeStart = week;
		} else if (last !== week - 1) {
			if (last === rangeStart) {
				ranges.push(last);
			} else {
				ranges.push(`${rangeStart} - ${last}`);
			}
			rangeStart = week;
		}
		last = week;
	}
	if (last === rangeStart) {
		ranges.push(last); 
	} else if (last) {
		ranges.push(`${rangeStart} - ${last}`);
	}
	return ranges.join(', ');
};
