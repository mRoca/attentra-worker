var fs = require("fs");
var gpio = require("gpio");

var db = require("./lib/db");
var conf = require("./lib/config");
var time = require("./lib/time");

db.events.on('ready', function() {
	console.log("Starting Worker...");

	if (process.argv && process.argv.length > 2)
	{
		var rfid = process.argv[2];
		db.presence.create();
	}
	console.log(process.argv);
	return;

	// Autorecalling Function
    (function forever() {
        synchronize(function(err) {
            if (err) console.error(err.message);
            setTimeout(forever, time.minute);
        });
    })();
});

function synchronize(_callback) {
	var error = new Error();
	console.log("Synchronizing");

	db.presence.read("synchronized=0")

	_callback(error);
}