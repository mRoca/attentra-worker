// ======================================================================================================================================================
// Modules
// ======================================================================================================================================================
 
var _ 		= require("underscore");
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

var db = null;

function BaseManager() {

};

BaseManager.prototype._query = function(_fn, _sql, _table) {
	log.debug("QUERY:", _sql);
	var that = this;
	var table = this.name;

	return new promise(function (resolve, reject) {
		_fn.call(db, _sql, helper.bindDomain(function(err, rows) {
			this.id = this.lastID;

			if (!err) {
				var msg = ["RESULT:"];
				if (rows && rows.length) msg.push("ROWS=" + rows.length); 
				if (this.id) msg.push("ID=" + this.id);
				if (this.changes) msg.push("CHANGES=" + this.changes);
				if (msg.length > 1) log.debug.call(log, msg.join(' '));
			}
			if (err) console.log(this.it, err);

			var data = _.pick(this, 'id', 'changes', 'sql');
			data.rows = rows;
			data.table = table;

			return (err ? reject(err) : resolve(data));
		}));
	});
};

BaseManager.prototype._sanityze = function(_data) {
	var table_keys = _.keys(this.columns);
	var user_keys = _.keys(_data);

	// sanityzing columns : removing unknown column name
	for (var i = 0, n = user_keys.length; i < n; i++)
		if (table_keys.indexOf(user_keys[i]) === -1)
			delete _data[user_keys[i]];
		else if (this.columns[user_keys[i]] == "TEXT")
			void 0; //TODO check value type

	return _data;
};

BaseManager.prototype._flatten = function(_result) {
	var rows = [];
	_.each(_result.rows, function(row) {
		rows.push(_.extend(_.omit(_result, 'rows'), row));
	});
	//if (rows.length === 0) rows.push(_.omit(_result, 'rows'));
	return promise.resolve(rows);
};

BaseManager.prototype.init = function() {
	var table = this.name;
	var data = qs.stringify(this.columns, ",", " ");
	var sql = util.format("CREATE TABLE IF NOT EXISTS %s (id INTEGER PRIMARY KEY, %s)", table, data);

	return this._query(db.run, sql);
};

BaseManager.prototype.drop = function() {
	var table = this.name;
	var sql = util.format("DROP TABLE %s", table);

	return this._query(db.run, sql);
};

BaseManager.prototype.create = function(_data) {
	_data = this._sanityze(_data);

	var keys = _.keys(_data).join();
	var values = _.values(_data).join();
	var sql = util.format("INSERT INTO %s (%s) VALUES (%s)", this.name, keys, values);

	if (keys.length === 0) return promise.resolve(-2);
		//throw new Error("Cannot create with NULL keys: " + keys);
	if (values.length === 0) return promise.resolve(-1);
		//throw new Error("Cannot create with NULL values: " + values);
	
	return this._query(db.run, sql);
};

BaseManager.prototype.read = function(_where) {
	var sql = util.format("SELECT * FROM %s WHERE 1=1", this.name);
	if (_where && _where.length) sql += " AND " + _where;

	return this._query(db.all, sql).then(this._flatten);
};

BaseManager.prototype.update = function(_data, _where) {
	_data = this._sanityze(_data);

	var values = qs.stringify(_data, ",", "=");
	var sql = util.format("UPDATE %s SET %s WHERE 1=1", this.name, values);
	if (_where && _where.length) sql += " AND " + _where;

	if (values.length === 0) return promise.resolve(-1)
		//throw new Error("Cannot create with NULL values: " + values);

	return this._query(db.run, sql);
};

BaseManager.prototype.delete = function(_where) {
	var sql = util.format("DELETE FROM %s WHERE 1=1", this.name);
	if (_where && _where.length) sql += " AND " + _where;

	return this._query(db.run, sql);
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
	if (typeof _id !== "number") throw new Error("Argument should be a number: " + _id);

	return this.update({"synchronized": 1}, "id = " + _id);
};

// ======================================================================================================================================================
// DB Manager (Exported)
// ======================================================================================================================================================

function DBManager() {
	this.mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
	this.db = new sqlite3.Database(config.db, this.mode, function(err) {
		if (err) log.fatal(err);
	});
	this.managers = {
		presence: new PresenceManager(),
	};

	// Export DB to Global Scope
	db = this.db;
};

DBManager.prototype.init = function() {
	var that = this;

	if (that.ready) return promise.resolve();
	
	return new promise(function (resolve, reject) {
		var managers = _.values(that.managers);
		var promises = _.invoke(managers, "init");

		// Mapping each managers to the DB Manager
		_.each(that.managers, function(value, key, list) {
			that[key] = list[key];
		});
		
		return promise.all(promises).done(function() {
			log.info("Database Ready", _.keys(that.managers));
			that.ready = true;
			return resolve();
		});
	});
};

DBManager.prototype.close = function() {
	var that = this;
	return new promise(function (resolve, reject) {
		db.close(function(err) {
			if (!err) that.ready = false;
			return (err ? reject(err) : resolve());
		});
	});
};

DBManager.prototype.add = function(_manager, _columns) {
	var that = this;

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this.managers[_manager] != null) throw new Error("Cannot override manager: " + _manager);

	var manager = new BaseManager();
	manager.name = _manager;
	manager.columns = _columns;
	
	return new promise(function(resolve, reject) {
		manager.init().done(function() {
			that.managers[_manager] = manager;
			that[_manager] = manager;
			return resolve();
		});
	});
};

DBManager.prototype.remove = function(_manager) {
	var that = this;

	if (!_manager) throw new Error("Manager must have a name: " + _manager);
	if (this.managers[_manager] == null) throw new Error("Cannot remove NULL manager: " + _manager);

	var manager = this.managers[_manager];

	return new promise(function(resolve, reject) {
		manager.drop().done(function() {
			delete that[_manager], delete that.managers[_manager];
			return resolve();
		});
	});

};

module.exports = new DBManager();
