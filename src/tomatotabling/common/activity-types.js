const TYPES = {
	"lecture": {
		"icon": "tti-lecture",
		"text": "L",
		"color": "#00c853"
	},
	"seminar": {
		"icon": "tti-seminar",
		"text": "S",
		"color": "#ff5722"
	},
	"tutorial": {
		"icon": "tti-tutorial",
		"text": "T",
		"color": "#1976d2"
	},
	"practical": {
		"icon": "tti-practical",
		"text": "P",
		"color": "#5e35b1"
	},
	"computing": {
		"icon": "tti-computing",
		"text": "C",
		"color": "#039be5"
	},
	"field work": {
		"icon": "tti-fieldwork",
		"text": "F",
		"color": "#795548"
	},
	"workshop": {
		"icon": "tti-workshop",
		"text": "W",
		"color": "#e91e63"
	},
	"exam": {
		"icon": "tti-exam",
		"text": "E",
		"color": "#37473F",
	},
	"unknown": {
		"icon": "tti-unknown",
		"text": "?",
		"color": "#000000"
	}
};

// in low -> high, to make -1 the lowest
export const TYPE_PRECEDENCE = ['workshop','field work','computing','practical','tutorial','seminar','lecture'];
export function typeComparer(a, b) {
	return TYPE_PRECEDENCE.indexOf(b.toLowerCase()) - TYPE_PRECEDENCE.indexOf(a.toLowerCase());
};

export function getTypeStyle(type) {
	return Object.assign({}, TYPES[type.toLowerCase()] || TYPES.unknown);
}
