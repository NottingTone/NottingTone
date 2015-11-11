"use strict";
var request = require('request');

function exercise (req, res) {
	var thisSemesterPeNumWeb = "";
	var lastSemesterPeNumWeb = "";
	var outputString = "";
	var projectCredit = 0;
	var safetyCredit = 0;
	var scoutCredit = 0;
	var outputString = "";
	
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		// this semester pe counts
		var urlThisSemesterPeNum = "http://unnctimetable.com/pe.php?stuid=" + this.user.info.stuId;
		request(urlThisSemesterPeNum, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				thisSemesterPeNumWeb += body;
			} else {
					// not success do stuff
				thisSemesterPeNumWeb = "Oops, there are some problems happens about your pe information of this semester";
			}

			
		})
		// last semester pe counts
		var urlLastSemesterPeNum = "http://unnctimetable.com/tiyuka.php?stuid=" + this.user.info.stuId;
				request(urlLastSemesterPeNum, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				lastSemesterPeNumWeb += body;
			} else {
					// not success do	 stuff
					thisSemesterPeNumWeb = "Oops, there are some problems happens about your pe information of last semester";
			}
		})
		
		// do stuff
		var urlCredit = "http://nottingham.coding.io/ajax/getCredits.php?student_no=" + this.user.info.stuId;
		request(urlurlCredit, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var jsonObj = JSON.parse(body);
				projectCredit += jsonObj['proejct_credit'];
				safetyCredit += jsonObj['safety_redit'];
				scoutCredit += jsonObj['scout_credit'];
			} else {
					// not success do stuff
				outputString = "Oops, there are some problems happens about your score information";
			}

			
		})
		
		outputString += thisSemesterPeNumWeb;
		outputString += "\n";
		outputString += lastSemesterPeNumWeb;
		outputString += "学号: ";
		outputString += this.user.info.stuId;
		outputString += "\n";
		outputString += "团日活动学分: ";
		outputString += projectCredit;
		outputString += "\n";
		outputString += "安全实践活动: ";
		outputString += safetyCredit;
		outputString += "\n";
		outputString += "项目活动: ";
		outputString += scoutCredit;
		
		// send outputString to user
		this.sendTextResponse("txt",outputString);
		
		
	}
	
	
}

module.exports = exercise;
