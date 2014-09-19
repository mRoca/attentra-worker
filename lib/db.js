var fs = require("fs");
var util = require("util");
var sqlite3 = require("sqlite3");
var promise = require("promise");
var qs = require("querystring");
var _ = require("underscore");

var config = require("./config");
var log = require("./log");

// ======================================================================================================================================================
// Base Manager (Abstract)
// ======================================================================================================================================================

function BaseManager() {
	var file = "db/db.sqlite";
	// var file = ":memory:";
	
	this.db = new sqlite3.Database(file);
	this.exists = file != ":memory:" && fs.existsSync(file);
};

BaseManager.prototype.close = function() {
	this.db.close();
};

BaseManager.prototype.init = function() {
	var that = this;
	var table = that.name;
	var data = qs.stringify(that.columns, ",", " ");
	var sql = util.format("CREATE TABLE %s (id INTEGER PRIMARY KEY, %s)", table, data);

	return new promise(function (resolve, reject) {
		if (!that.exists) {
			that.db.run(sql, function(err) {
				if (err) log.error(err.message);
				else log.debug("CREATE TABLE", table);

				return (err ? reject(err) : resolve(table));
			});
		} else resolve(table);
	});
};

BaseManager.prototype.create = function(_data) {
	var that = this;
	var table_keys = _.keys(that.columns);
	var user_keys = _.keys(_data);

	// sanityzing columns : removing unknown column name
	for (var i = 0, n = user_keys.length; i < n; i++)
		if (table_keys.indexOf(user_keys[i]) === -1)
			delete _data[user_keys[i]];
		else if (that.columns[user_keys[i]] == "TEXT");

	var keys = _.keys(_data).join();
	var values = _.values(_data).join();
	var sql = util.format("INSERT INTO %s (%s) VALUES (%s)", that.name, keys, values);

	return new promise(function (resolve, reject) {
		that.db.run(sql, function(err) {
			if (err) log.error(err.message);
			else log.debug(sql, this.lastID, this.changes);

			return (err ? reject(err) : resolve());
		});
	});
};

BaseManager.prototype.read = function(_where) {
	var that = this;
	var sql = util.format("SELECT * FROM %s WHERE 1=1", that.name);
	if (_where && _where.length) sql += " AND " + _where;

	return new promise(function (resolve, reject) {
		that.db.all(sql, function(err, rows) {
			if (err) log.error(err.message);
			else log.debug(sql, rows.length);

			return (err ? reject(err) : resolve(rows));
		});
	});	
};

BaseManager.prototype.update = function(_data, _where) {
	var that = this;
	var values = qs.stringify(_data, ",", "=");
	var sql = util.format("UPDATE %s SET %s WHERE 1=1", that.name, values);
	if (_where && _where.length) sql += " AND " + _where;

	return new promise(function (resolve, reject) {
		that.db.run(sql, function(err) {
			if (err) log.error(err);
			else log.debug(sql, this.lastID, this.changes);

			return (err ? reject(err) : resolve());
		});
	});
};

BaseManager.prototype.delete = function(_where) {
	var that = this;
	var sql = util.format("DELETE FROM %s WHERE 1=1", that.name);
	if (_where && _where.length) sql += " AND " + _where;

	return new promise(function (resolve, reject) {
		that.db.run(sql, function(err) {
			if (err) log.error(err.message);
			else log.debug(sql, this.lastID, this.changes);

			return (err ? reject(err) : resolve());
		});
	});
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
		promise.all(promises).done(function(managers) {
			log.info("Database Ready");
			return resolve();
		});
	});
}

module.exports = new DBManager();
