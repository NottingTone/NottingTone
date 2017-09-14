import moment from 'moment';

function fitActivtyInCell(activity) {
	const ret = { ...activity };
	ret.start = Math.floor(ret.start);
	ret.end = Math.ceil(ret.end);
	return ret;
}

class GridDayRow {
	constructor() {
		this.activities = [];
	}

	addActivity(activity) {
		for (const existentActivity of this.activities) {
			if (activity.start < existentActivity.end && activity.end > existentActivity.start) {
				return false;
			}
		}
		this._addActivity(activity);
		return true;
	}

	_addActivity(activity) {
		this.activities.push(fitActivtyInCell(activity));
	}

	startRead() {
		this.cursor = -1;
		this.activities.sort((a, b) => a.start - b.start);
	}

	read(time) {
		let current = this.activities[this.cursor];
		if (this.cursor === -1 || (current && current.end === time)) {
			++this.cursor;
			current = this.activities[this.cursor];
			if (current && current.start !== time) {
				return {
					type: 'empty',
					start: time,
					end: current.start,
				};
			} else if (!current) {
				return {
					type: 'empty',
					start: time,
					end: 18,
				};
			}
		}
		if (current && current.start === time) {
			return current;
		}
		return false;
	}
}

export class GridDay {
	constructor() {
		this.rows = [new GridDayRow()];
	}

	addActivity(activity) {
		for (const row of this.rows) {
			if (row.addActivity(activity)) {
				return;
			}
		}
		const row = new GridDayRow();
		row.addActivity(activity);
		this.rows.push(row);
	}
}
