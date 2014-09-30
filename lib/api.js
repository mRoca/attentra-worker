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
	this.format = "json";
};

BaseManager.prototype._error = function(_err) {
	if (_err) log.error(_err);
};

BaseManager.prototype._request = function(_data, _opts, _code) {
	log.debug("REQUEST:", _opts.method, this.uri(), _opts.form);

	var that = this;
	var is_json = this.endpoint.indexOf(".json") > -1;

	if (typeof _code === "number")
		_code = [_code];

	return new promise(helper.bindDomain(function (resolve, reject) {
		request(_opts, function(err, response, body) {
			var code = response != null && response.statusCode;
			var valid = _code.indexOf(code) > -1;
			var fail = (err != null || valid === false);
			if (!err && fail) err = new Error(response.statusCode);

			if (fail) that._error(err);
			else log.trace("RESPONSE:", code, body);

			var location = response && response.headers && response.headers.location;
			if (location) _data.id = parseInt(location.match(/[\d]+/));
				
			var res = _code.indexOf(200) > -1 ? helper.parseJSON(body) : _data;
			return (fail ? reject(err) : resolve(res));
		});
	}));
};

BaseManager.prototype._opts = function(_method) {
	return {
		uri: this.basepoint + this.uri(),
		method: _method
	};
};

BaseManager.prototype.uri = function(_basepoint) {
	return this.endpoint + (this.id ? "/" + this.id : "") + (this.format ? "." + this.format : "");
};

BaseManager.prototype.setID = function(_id) {
	this.id = _id;
};

// ======================================================================================================================================================
// HTTP Methods
// ======================================================================================================================================================

BaseManager.prototype.get = function(_code) {
	var opts = this._opts("GET");
	return this._request(null, opts, _code || 200);
};

BaseManager.prototype.head = function(_code) {
	var opts = this._opts("HEAD");
	return this._request(null, opts, _code || 200);
};

BaseManager.prototype.post = function(_data, _code) {
	var opts = this._opts("POST");
	var attributes = [_data].concat(this.params);
	opts.form = _.pick.apply(this, attributes);

	return this._request(_data, opts, _code || 201);
};

BaseManager.prototype.put = function(_data, _code) {
	var opts = this._opts("PUT");
	var attributes = [_data].concat(this.params);
	opts.form = _.pick.apply(this, attributes);

	return this._request(_data, opts, _code || [201, 204]);
};

BaseManager.prototype.delete = function(_code) {
	var opts = this._opts("DELETE");
	return this._request(null, opts, _code || 204);
};

BaseManager.prototype.trace = function(_code) {
	var opts = this._opts("TRACE");
	return this._request(null, opts, _code || 204);
};

BaseManager.prototype.options = function(_code) {
	var opts = this._opts("OPTIONS");
	return this._request(null, opts, _code || 204);
};

BaseManager.prototype.patch = function(_data, _code) {
	var opts = this._opts("PATCH");
	var attributes = [_data].concat(this.params);
	opts.form = _.pick.apply(this, attributes);

	return this._request(_data, opts, _code || 204);
};

// ======================================================================================================================================================
// Presence Manager
// ======================================================================================================================================================

function PresenceManager() {
	this.endpoint = "timeinputs";
	this.params = ["identifier", "datetime", "description", "type"];
};
PresenceManager.inheritsFrom(BaseManager);

// ======================================================================================================================================================
// API Manager (Exported)
// ======================================================================================================================================================

function APIManager() {
	this.presence = new PresenceManager();
};

APIManager.prototype.add = function(_manager, _endpoint, _params, _format) {

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this[_manager] != null) throw new Error("Cannot override manager: " + _manager);

	var manager = new BaseManager();
	manager.endpoint = _endpoint;
	manager.params = _params;

	if (_format != null) manager.format = _format;

	this[_manager] = manager;

};

APIManager.prototype.remove = function(_manager) {

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this[_manager] == null) throw new Error("Cannot remove NULL manager: " + _manager);

	delete this[_manager];
};

module.exports = new APIManager();
