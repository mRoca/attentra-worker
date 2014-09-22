// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================

var bunyan = require("bunyan");

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================
 
var config = require("./config");

// ======================================================================================================================================================
// Bunyan Logging Library : https://github.com/trentm/node-bunyan
// ======================================================================================================================================================

var ringbuffer = new bunyan.RingBuffer({limit: 10});

var streams = [{
	level: "trace",
	type: "raw",
	stream: ringbuffer
}];

if (config.development) streams.push({level: "trace", stream: process.stdout});
else if (config.production) streams.push({level: "info", type: "rotating-file", path: "log/main.log", period: "1d", count: 3});

var logger = bunyan.createLogger({
	name: config.name,
	streams: streams
});

bunyan.prototype.buffer = function() {
	return ringbuffer.records;
};

module.exports = logger;
