"use strict";
var request = require('request');

function exercise (req, res) {
	var this_semester_pe_num_web = "";
	var last_semester_pe_num_web = "";
	
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		// do stuff
		var url_this_semester_pe_num = "http://unnctimetable.com/pe.php?stuid=" + this.user.info.stuId;
		request(url_this_semester_pe_num, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				this_semester_pe_num_web += body;
			} else {
					// not success do stuff
				this_semester_pe_num_web = "Oops, there are some problems happens about your pe information of this semester";
			}

			
		})
		var url_last_semester_pe_num = "http://unnctimetable.com/tiyuka.php?stuid=" + this.user.info.stuId;
				request(url_last_semester_pe_num, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				last_semester_pe_num_web += body;
			} else {
					// not success do stuff
					this_semester_pe_num_web = "Oops, there are some problems happens about your pe information of last semester";
			}
		})
		
		var outputString = this_semester_pe_num_web + "\n" + last_semester_pe_num_web;
		
		// send outputString to user
		this.sendRawResponse('txt',outputString]);
	}
}

module.exports = exercise;