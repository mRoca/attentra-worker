// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================

var _ 		= require("underscore");
var bunyan 	= require("bunyan");

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================
 
var config	= require("./config");

// ======================================================================================================================================================
// RingBuffer
// ======================================================================================================================================================

var ringbuffer = new bunyan.RingBuffer({limit: 10});

bunyan.prototype.limit = function(_limit) {
	if (typeof _limit !== "number") throw new Error("RingBuffer limit must be a number");
	
	logger.ringbuffer.limit = _limit;
};

bunyan.prototype.buffer = function(_count) {	
	return ringbuffer.records;
};

bunyan.prototype.clear = function() {
	ringbuffer.records = [];
};

// ======================================================================================================================================================
// Bunyan Logging Library : https://github.com/trentm/node-bunyan
// ======================================================================================================================================================

var streams = [{level: "trace", type: "raw", stream: ringbuffer}];

if (config.development) streams.push({level: "debug", stream: process.stdout});
else if (config.production) streams.push({level: "info", type: "rotating-file", path: "log/main.log", period: "1d", count: 3});

var logger = bunyan.createLogger({
	name: config.name,
	src: config.development,
	streams: streams
});

logger.ringbuffer = ringbuffer;

module.exports = logger;
