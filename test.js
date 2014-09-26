'use strict';

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var _ 		= require("underscore");
var test 	= require("unit.js");
var promise = require("promise");

var rand = parseInt(Math.random() * 100, 10);

describe("Database Library", function() {

	var db = require("./lib/db");
	var table_name = "nosql";
	var table_columns = {"key": "TEXT", "value": "TEXT"};
	var obj = {key: 42, value: 101};

	var tester = function(type, results) {
		_.each(results, function(result) {
			if (typeof result === "object" && result != null) {
				var tester = test.object(result);
				tester.hasProperty("table");
				tester.hasProperty("sql");
				tester.hasProperty("id");

				if (type == "create") {
					tester.hasProperty("changes");
					tester.number(result.changes).is(1);
				}
				if (type == "update") {
					tester.hasProperty("changes");
					tester.number(result.changes).is(result.id);
				}
			}
		});
	};

	var testCreate = tester.bind(this, "create");
	var testRead = tester.bind(this, "read");
	var testUpdate = tester.bind(this, "update");
	var testDelete = tester.bind(this, "delete");

	it("#init()", function(done) {
		db.init().then(function() {
			test.bool(db.ready).isTrue();
		}).done(done);
	});

	it("#add(" + table_name + ")", function(done) {
		db.add(table_name, table_columns).then(function() {
			test.object(db).hasProperty(table_name);
		}).done(done);
	});

	it("#create()", function(done) {
		return promise.all(_.map(_.keys(db.managers), function(manager) {
			return db[manager].create(_.clone(obj));
		})).then(testCreate).done(done);
	});

	it("#update()", function(done) {
		return promise.all(_.map(_.keys(db.managers), function(manager) {
			return db[manager].update({value: rand});
		})).then(testUpdate).done(done);
	});

	it("#read()", function(done) {
		return promise.all(_.map(_.keys(db.managers), function(manager) {
			return db[manager].read({value: rand});
		})).then(_.flatten).then(testRead).done(done);
	});

	it("#delete()", function(done) {
		return promise.all(_.map(_.keys(db.managers), function(manager) {
			return db[manager].delete();
		})).then(testDelete).done(done);
	});

	it("#create() + #update(created) + #read(updated) + #delete(readed) + #read(deleted)", function(done) {

		promise.resolve(table_name).then(function(manager) { 

			// CREATE
			return db[manager].create(_.clone(obj));

		}).then(function(result) { 

			// UPDATE CREATED
			return db[result.table].update({value: rand}, "id=" + result.id);

		}).then(function(result) { 

			// READ UPDATED
			return db[result.table].read("id=" + result.id).then(function(results) {
				// VERIFY UPDATE
				var result = results.length > 0 && results[0];
				test.number(Number(result.value)).is(rand);
				return promise.resolve(result);
			});

		}).then(function(result) { 

			// DELETE UPDATED
			return db[result.table].delete("id=" + result.id);

		}).then(function(result) {

			// READ DELETED
			return db[result.table].read("id=" + result.id).then(function(results) {
				// VERIFY DELETE
				test.array(results).isEmpty();
				return promise.resolve();				
			});

		}).done(done);

	});

	it("#remove(" + table_name + ")", function(done) {

		return db.remove(table_name).then(function() {
			test.object(db).hasNotProperty(table_name);
		}).done(done);

	});

	it("#close()", function(done) {

		return db.close().then(function() {
			test.bool(db.ready).isFalse();
		}).done(done);

	});
});

describe("API Library", function() {

	var api = require("./lib/api");



	it("#head()", function(done) {

		done();

	});

	it("#get()", function(done) {

		done();

	});

	it("#post()", function(done) {

		done();

	});

	it("#put()", function(done) {

		done();

	});

	it("#delete()", function(done) {

		done();

	});

	it("#options()", function(done) {

		done();

	});

});

