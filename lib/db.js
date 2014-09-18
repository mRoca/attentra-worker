var fs = require("fs");
var util = require("util");
var sqlite3 = require("sqlite3");
var promise = require("promise");
var qs = require("querystring");
var _ = require("underscore");
var EventEmitter = require('events').EventEmitter;

// ======================================================================================================================================================
// BaseManager (Abstract)
// ======================================================================================================================================================

Function.prototype.inheritsFrom = function(parentClassOrObject) {
	if (parentClassOrObject.constructor == Function) // Normal Inheritance
	{
		this.prototype = new parentClassOrObject;
		this.prototype.parent = parentClassOrObject.prototype;
	} 
	else // Pure Virtual Inheritance 
	{ 
		this.prototype = parentClassOrObject;
		this.prototype.parent = parentClassOrObject;
	}
	this.prototype.constructor = this;
	return this;
}  

function BaseManager() {
	var file = "db/db.sqlite";
	//var file = ":memory:";
	
	this.db = new sqlite3.Database(file);
	this.exists = file != ':memory:' && fs.existsSync(file);
};

BaseManager.prototype.close = function() {
	this.db.close();
};

BaseManager.prototype.init = function() {
	var that = this;
	var data = qs.stringify(that.columns, ',', ' ');
	var sql = util.format("CREATE TABLE %s (id INTEGER PRIMARY KEY, %s)", that.name, data);

	return new promise(function (resolve, reject) {
		if (!that.exists) {
			that.db.run(sql, function(err) {
				if (err) console.error(err.message);
				else console.log("CREATE TABLE", that.name);

				return (err ? reject(err) : resolve());
			});
		} else resolve();
	});
};

BaseManager.prototype.create = function(_data) {
	var that = this;
	var columns = _.keys(_data).join();
	var values = Array.prototype.slice.call(arguments).join();
	var sql = util.format("INSERT INTO %s (%s) VALUES (%s)", that.name, columns, values);

	// checks columns name presence
	

	return new promise(function (resolve, reject) {
		that.db.run(sql, function(err) {
			if (err) console.error(err.message);
			else console.log(sql, this.lastID, this.changes);

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
			if (err) console.error(err.message);
			else console.log(sql, rows);

			return (err ? reject(err) : resolve(rows));
		});
	});	
};

BaseManager.prototype.update = function(_data, _where) {
	var that = this;
	var values = qs.stringify(_data, ',', '=');
	var sql = util.format("UPDATE %s SET %s WHERE 1=1", that.name, values);
	if (_where && _where.length) sql += " AND " + _where;

	return new promise(function (resolve, reject) {
		that.db.run(sql, function(err) {
			if (err) console.error(err);
			else console.log(sql, this.lastID, this.changes);

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
			if (err) console.error(err.message);
			else console.log(sql, this.lastID, this.changes);

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
		"rfid": "TEXT",
		"timestamp": "DATETIME",
		"synchronized": "INTEGER"
	};
};
PresenceManager.inheritsFrom(BaseManager);

// ======================================================================================================================================================
// DB Manager
// ======================================================================================================================================================

function DBManager() {
	var that = this;
	this.events = new EventEmitter();

	this.presence = new PresenceManager();
	this.presence.init();

	console.log("Database Ready");
	setTimeout(this.events.emit.bind(this.events, 'ready'), 0);
};

module.exports = new DBManager();
