"use strict";

function exercise (req, res) {
	var project_credit = 0;
	var safety_credit = 0;
	var scout_credit = 0;
	var outputString = "";
	
	if (!this.user.info.stuId) {
		this.handOver('REQUIRE_STUID');
	} else {
		// do stuff
		var url = "http://nottingham.coding.io/ajax/getCredits.php?student_no=" + this.user.info.stuId;
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var jsonObj = JSON.parse(body);
				project_credit += jsonObj['proejct_credit'];
				safety_credit += jsonObj['safety_credit'];
				scout_credit += jsonObj['scout_credit'];
			} else {
					// not success do stuff
				outputString = "Oops, there are some problems happens about your pe information of this semester";
			}

			
		})
		outputString += "ѧ��: ";
		outputString += this.user.info.stuId;
		outputString += "\n";
		outputString += "���ջѧ��: ";
		outputString += project_credit;
		outputString += "\n";
		outputString += "��ȫʵ���: ";
		outputString += safety_credit;
		outputString += "\n";
		outputString += "��Ŀ�: ";
		outputString += scout_credit;
				
		// send outputString to user
		this.sendRawResponse('txt',outputString]);
	}
}

module.exports = exercise;