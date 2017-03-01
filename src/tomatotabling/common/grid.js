import moment from 'moment';

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
		const dayStart = moment('09:00', 'HH:mm');
		this.activities.push(activity);
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
