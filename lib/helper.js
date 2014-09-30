// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var log = require("./log").child({lib: "helper"});

// ======================================================================================================================================================
// Helper Functions
// ======================================================================================================================================================

function Helper() {

}

Helper.prototype.parseJSON = function(_string) {
	var json = "";
	try {
		if (_string.length) json = JSON.parse(_string);
	} catch (e) {
		json = _string;
		log.error("Error parsing JSON: " + _string.length);
	}
	return json;
};

Helper.prototype.bindDomain = function(_fn) {
	return process.domain ? process.domain.bind(_fn) : _fn;
};

module.exports = new Helper();