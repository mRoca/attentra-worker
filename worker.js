
// ======================================================================================================================================================
// NPM Modules
// ======================================================================================================================================================

var _ = require("underscore");
var fs = require("fs");
var gpio = require("gpio");
var crypto = require("crypto");
var promise = require("promise");
var domain = require("domain").create();

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var init = require("./lib/init");
var api = require("./lib/api");
var db = require("./lib/db");
var conf = require("./lib/config");
var time = require("./lib/time");
var log = require("./lib/log");

// ======================================================================================================================================================
// Setup Worker
// ======================================================================================================================================================

domain.on("error", function(err) {
	log.critical(err);
}).run(function() {
	db.init().done(main);
});

// ======================================================================================================================================================
// Worker Functions
// ======================================================================================================================================================

function main() {
	log.info("Starting Worker...");

	// Simulate Badging
	if (process.argv && process.argv.length === 3 && process.argv[2] == "badge")
	{
		var identifier = "'" + crypto.randomBytes(10).toString("base64") + "'";
		var datetime = "'" + (new Date).toISOString() + "'";
		db.presence.create({identifier: identifier, datetime: datetime});
	}

	// Autorecalling Function
	(function forever() {
		sync(function(err) {
			if (err) log.error(err.message);
			setTimeout(forever, time.minute);
		});
	})();
};

function sync(_callback) {
	log.info("Synchronizing");

	db.presence.read("synchronized IS NULL").then(function(rows) {

		var promises = [];
		for (var i in rows) promises.push(api.presence.post(rows[i]));

		promise.all(promises).then(function(res) {
			log.warn(res);

			_callback();
		});
	});
};
