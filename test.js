'use strict';

// ======================================================================================================================================================
// Libs
// ======================================================================================================================================================

var _ 		= require("underscore");
var test 	= require("unit.js");
var promise = require("promise");
var util	= require("util");

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

	it(util.format("#add(%s)", table_name), function(done) {
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

describe("API Library Doc", function() {

	var api = require("./lib/api");
	var api_mockup = "doc";
	var http_ok_code = 200;
	var http_not_allowed_code = 405;

	it(util.format("#add(%s)", api_mockup), function() {
		api.add(api_mockup, api_mockup, null, "");
		test.object(api).hasProperty(api_mockup);
	});

	it("#get() : OK", function(done) {
		return api[api_mockup].get(http_ok_code).then(function(res) {
			test.string(res).isNotEmpty();
		}).done(done);
	});

	it("#head() : OK", function(done) {
		return api[api_mockup].head(http_ok_code).then(function(res) {
			test.string(res).isEmpty();
		}).done(done);
	});

	it("#post() : Method Not Allowed", function(done) {
		return api[api_mockup].post(null, http_not_allowed_code).done(done);
	});

	it("#put() : Method Not Allowed", function(done) {
		return api[api_mockup].put(null, http_not_allowed_code).done(done);
	});

	it("#delete() : Method Not Allowed", function(done) {
		return api[api_mockup].delete(http_not_allowed_code).done(done);
	});

	it("#trace() : Method Not Allowed", function(done) {
		return api[api_mockup].trace(http_not_allowed_code).done(done);
	});

	it("#options() : Method Not Allowed", function(done) {
		return api[api_mockup].options(http_not_allowed_code).done(done);
	});

	it("#patch() : Method Not Allowed", function(done) {
		return api[api_mockup].patch(null, http_not_allowed_code).done(done);
	});

	it(util.format("#remove(%s)", api_mockup), function() {
		api.remove(api_mockup);
		test.object(api).hasNotProperty(api_mockup);
	});

});

describe("API Library Timeinputs", function() {

	var api = require("./lib/api");
	var identifier = "MOCKUP_ID";
	var post_data = {identifier: identifier, datetime: (new Date).toISOString()};
	var patch_data = {description: "TEST_PATCH"};

	it("#get() /new : OK [checking format]", function(done) {

		// setup
		var default_presence_endpoint = api.presence.endpoint;
		api.presence.endpoint = "timeinputs/new";

		return api.presence.get().then(function(res) {
			test.object(res).hasProperty("children");
			var children = _.keys(res.children);
			test.array(children).hasValues(api.presence.params);

			// teardown
			api.presence.endpoint = default_presence_endpoint;

		}).done(done);

	});

	it("#get() : OK", function(done) {
		return api.presence.get().then(function(results) {
			test.array(results).isNotEmpty();
			_.each(results, function(result) {
				test.object(result).hasProperty("id");
			});
		}).done(done);
	});

	it("#post() : Created", function(done) {
		return api.presence.post(post_data).then(function(res) {
			_.each(_.keys(post_data), function(prop) {
				test.object(res).hasProperty(prop);
			});

			test.object(res).hasProperty("id");
			api.presence.setID(res.id);
			test.object(api.presence).hasProperty("id");
		}).done(done);
	});

	it("#get(posted) : OK", function(done) {
		return api.presence.get().then(function(res) {
			_.each(_.keys(post_data), function(prop) {
				test.object(res).hasProperty(prop);
			});
		}).done(done);
	});	

	it("#patch(getted) : No Content", function(done) {
		return api.presence.patch(patch_data).then(function(res) {
			_.each(_.keys(patch_data), function(prop) {
				test.object(res).hasProperty(prop);
			});
			
			test.object(res).hasProperty("id");
		}).done(done);
	});

	it("#get(patched) : OK", function(done) {
		return api.presence.get().then(function(res) {
			_.each(_.keys(post_data).concat(_.keys(patch_data)), function(prop) {
				test.object(res).hasProperty(prop);
			});
			
			test.string(res.description).isIdenticalTo(patch_data.description);
		}).done(done);
	});

	it("#delete(getted) : No Content", function(done) {
		return api.presence.delete().then(function(res) {
			test.value(res).isNull();
		}).done(done);
	});

	it("#get(deleted) : Not Found", function(done) {
		return api.presence.get(404).then(function(res) {
			test.value(res).isNull();
		}).done(done);
	});

});
