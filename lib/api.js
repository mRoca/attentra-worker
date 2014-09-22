// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================
 
var _ 		= require("underscore");
var request = require("request");
var promise = require("promise");

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var config 	= require("./config");
var log 	= require("./log").child({lib: "api"});
var helper 	= require("./helper");

// ======================================================================================================================================================
// Base Manager (Abstract)
// ======================================================================================================================================================

function BaseManager() {
	this.basepoint = config.server + "api/";	
};

BaseManager.prototype.error = function(_err) {
	if (_err) log.error(_err);
};

BaseManager.prototype.opts = function(_method) {
	return {
		uri: this.basepoint + this.endpoint,
		method: _method
	};
};

BaseManager.prototype.get = function() {
	var opts = this.opts("GET");
	return this.request(null, opts, 200);
};

BaseManager.prototype.post = function(_data) {
	var opts = this.opts("POST");
	var attributes = [_data].concat(this.params);
	opts.form = _.pick.apply(this, attributes);

	return this.request(_data, opts, 201);
};

BaseManager.prototype.request = function(_data, _opts, _code) {
	log.debug("REQUEST:", _opts.method, _opts.uri, _opts.form);
	var that = this;

	return new promise(helper.bindDomain(function (resolve, reject) {
		request(_opts, function(err, response, body) {
			var code = response != null && response.statusCode;
			var valid = (code === _code);
			var fail = (err != null || valid === false);
			if (!err && fail) err = new Error(response.statusCode);

			if (fail) that.error(err);
			else log.debug("RESPONSE:", code, body);

			var res = _opts.method == "GET" ? helper.parseJSON(body) : _data;
			return (fail ? reject(err) : resolve(res));
		});
	}));
};

// ======================================================================================================================================================
// Presence Manager
// ======================================================================================================================================================

function PresenceManager() {
	this.endpoint = "timeinputs.json";
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
