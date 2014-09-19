var _ = require("underscore");
var request = require("request");
var promise = require("promise");

var config = require("./config");
var log = require("./log");
var helper = require("./helper");

// ======================================================================================================================================================
// Base Manager (Abstract)
// ======================================================================================================================================================

function BaseManager() {
	this.basepoint = config.server + "api/";	
};

BaseManager.prototype.opts = function(_method) {
	return {
		uri: this.basepoint + this.endpoint,
		method: _method
	};
}

BaseManager.prototype.get = function() {
	var opts = this.opts("GET");

	return new promise(function (resolve, reject) {
		request(opts, function(err, response, body) {
			var json = helper.parseJSON(body);
			if (err) log.error(err.message);
			else log.debug(opts.method, opts.uri, json);

			return (err ? reject(err) : resolve(json));
		});
	});
};

BaseManager.prototype.post = function(_data) {
	var that = this;
	var opts = that.opts("POST");
	var attributes = [_data].concat(that.params);
	opts.form = _.pick.apply(that, attributes);

	return new promise(function (resolve, reject) {
		request(opts, function(err, response, body) {
			var json = helper.parseJSON(body);
			if (err) log.error(err.message);
			else log.debug(opts.method, opts.uri, json);

			return (err ? reject(err) : resolve(json));
		});
	});
};

// ======================================================================================================================================================
// Presence Manager
// ======================================================================================================================================================

function PresenceManager() {
	this.endpoint = "timeinputs";
	this.params = ["identifier", "datetime"];
};
PresenceManager.inheritsFrom(BaseManager);

// ======================================================================================================================================================
// API Manager (Exported)
// ======================================================================================================================================================

function APIManager() {
	this.presence = new PresenceManager();
};

module.exports = new APIManager();
