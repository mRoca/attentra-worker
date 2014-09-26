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

BaseManager.prototype._error = function(_err) {
	if (_err) log.error(_err);
};

BaseManager.prototype._request = function(_data, _opts, _code) {
	log.debug("REQUEST:", _opts.method, _opts.uri, _opts.form);
	var that = this;

	return new promise(helper.bindDomain(function (resolve, reject) {
		request(_opts, function(err, response, body) {
			var code = response != null && response.statusCode;
			var valid = (code === _code);
			var fail = (err != null || valid === false);
			if (!err && fail) err = new Error(response.statusCode);

			if (fail) that._error(err);
			else log.debug("RESPONSE:", code, body);

			var res = _opts.method == "GET" ? helper.parseJSON(body) : _data;
			return (fail ? reject(err) : resolve(res));
		});
	}));
};

BaseManager.prototype._opts = function(_method) {
	return {
		uri: this.basepoint + this.endpoint,
		method: _method
	};
};

BaseManager.prototype.get = function() {
	var opts = this._opts("GET");
	return this._request(null, opts, 200);
};

BaseManager.prototype.post = function(_data) {
	var opts = this._opts("POST");
	var attributes = [_data].concat(this.params);
	opts.form = _.pick.apply(this, attributes);

	return this._request(_data, opts, 201);
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

APIManager.prototype.add = function(_manager, _endpoint, _params) {

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this[manager] != null) throw new Error("Cannot override manager: " + _manager);

	var manager = new BaseManager();
	manager.endpoint = _endpoint;
	manager.params = _params;
	this[_manager] = manager;

};

APIManager.prototype.remove = function(_manager) {

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this[manager] == null) throw new Error("Cannot remove NULL manager: " + _manager);

	delete this[manager];
};

module.exports = new APIManager();
