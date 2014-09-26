// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================

var _ 		= require("underscore");
var fs 		= require("fs");
var gpio 	= require("gpio");
var promise = require("promise");
var domain 	= require("domain").create();

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var init 	= require("./lib/init");
var api 	= require("./lib/api");
var db 		= require("./lib/db");
var conf 	= require("./lib/config");
var time 	= require("./lib/time");
var log 	= require("./lib/log").child({lib: "worker"});

// ======================================================================================================================================================
// Worker Functions
// ======================================================================================================================================================

function Worker() {
	this.sync_delay = 3 * time.second;
	domain.add(db);
};

Worker.prototype.start = function () {
	var that = this;
	
	that.sync(function() {
		setTimeout(that.start.bind(that), that.sync_delay);
	});
};

Worker.prototype.sync = function (_callback) {
	log.info("Synchronizing...");

	db.presence.read("synchronized IS NULL").then(function(data) {

		return promise.all(_.map(data.rows, function(row) {
			return api.presence.post(row);
		}));

	}).then(function(results) {

		return promise.all(_.chain(results).filter(function(result) {
			return result.id != null;
		}).map(function(result) {
			return db.presence.sync(result.id);
		}).value());

	}).done(_callback);
};

// ======================================================================================================================================================
// Setup Worker
// ======================================================================================================================================================

process.on("uncaughtException", function(err) {
	// This should never happens
	log.fatal("UncaughtException", err);
});

domain.on("error", function(err) {
	log.error("Domain", err.stack);
	setTimeout(main, 1000);
});

function main() {
	domain.run(function() {
		log.info("Starting Worker...");

		// This should never happens
		if (process.domain === undefined) log.fatal("UndefinedDomain");

		var worker = new Worker();
		worker.start();
	});
};

domain.run(function() {
	db.init().done(main);
});
