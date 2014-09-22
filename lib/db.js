// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================
 
var _ 		= require("underscore");
var fs 		= require("fs");
var util 	= require("util");
var sqlite3 = require("sqlite3");
var promise = require("promise");
var qs 		= require("querystring");

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var init 	= require("./init");
var config 	= require("./config");
var helper 	= require("./helper");
var log 	= require("./log").child({lib: "db"});

// ======================================================================================================================================================
// Base Manager (Abstract)
// ======================================================================================================================================================

function BaseManager() {
	var file = "db/db.sqlite";
	// var file = ":memory:";
	
	this.mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
	this.db = new sqlite3.Database(file, this.mode, this.error);
	this.exists = file != ":memory:" && fs.existsSync(file);
};

BaseManager.prototype.error = function(_err) {
	if (_err) void 0;
};

BaseManager.prototype.close = function() {
	this.db.close(this.error);
};

BaseManager.prototype.init = function() {
	var that = this;
	var table = that.name;
	var data = qs.stringify(that.columns, ",", " ");
	var sql = util.format("CREATE TABLE %s (id INTEGER PRIMARY KEY, %s)", table, data);

	return new promise(function (resolve, reject) {
		if (!that.exists) {
			that.db.run(sql, helper.bindDomain(function(err) {
				if (err) that.error(err);
				else log.debug("CREATE TABLE", table);

				return (err ? reject(err) : resolve(table));
			}));
		} else resolve(table);
	});
};

BaseManager.prototype.query = function(_fn, _sql) {
	log.debug("QUERY:", _sql);
	var that = this;

	return new promise(function (resolve, reject) {
		_fn.call(that.db, _sql, helper.bindDomain(function(err, data) {
			//err = new Error("FATAL ERR");

			if (err) that.error(err);
			else log.debug("RESULT:", "ROWS=" + (data && data.length), "ID=" + this.lastID, "CHANGES=" + this.changes);

			return (err ? reject(err) : resolve(data));
		}));
	});
};

BaseManager.prototype.create = function(_data) {
	var table_keys = _.keys(this.columns);
	var user_keys = _.keys(_data);

	// sanityzing columns : removing unknown column name
	for (var i = 0, n = user_keys.length; i < n; i++)
		if (table_keys.indexOf(user_keys[i]) === -1)
			delete _data[user_keys[i]];
		else if (this.columns[user_keys[i]] == "TEXT");

	var keys = _.keys(_data).join();
	var values = _.values(_data).join();
	var sql = util.format("INSERT INTO %s (%s) VALUES (%s)", this.name, keys, values);

	return this.query(this.db.run, sql);
};

BaseManager.prototype.read = function(_where) {
	var sql = util.format("SELECT * FROM %s WHERE 1=1", this.name);
	if (_where && _where.length) sql += " AND " + _where;

	return this.query(this.db.all, sql);
};

BaseManager.prototype.update = function(_data, _where) {
	var values = qs.stringify(_data, ",", "=");
	var sql = util.format("UPDATE %s SET %s WHERE 1=1", this.name, values);
	if (_where && _where.length) sql += " AND " + _where;

	return this.query(this.db.run, sql);
};

BaseManager.prototype.delete = function(_where) {
	var sql = util.format("DELETE FROM %s WHERE 1=1", this.name);
	if (_where && _where.length) sql += " AND " + _where;

	return this.query(this.db.run, sql);
};

// ======================================================================================================================================================
// Presence Manager 
// ======================================================================================================================================================

function PresenceManager() {
	this.name = "presences";
	this.columns = {
		"identifier": "TEXT",
		"datetime": "DATETIME",
		"synchronized": "INTEGER"
	};
};
PresenceManager.inheritsFrom(BaseManager);

PresenceManager.prototype.sync = function(_id) {
	this.update({synchronized: 1}, "id = " + _id);
};

// ======================================================================================================================================================
// DB Manager (Exported)
// ======================================================================================================================================================

function DBManager() {
	this.presence = new PresenceManager();
};

DBManager.prototype.init = function() {
	var that = this;
	return new promise(function (resolve, reject) {
		var managers = _.values(that);
		var promises = _.invoke(managers, "init");
		
		return promise.all(promises).done(function(managers) {
			log.info("Database Ready", managers);
			return resolve();
		});
	});
}

module.exports = new DBManager();
