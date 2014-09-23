'use strict';
process.env.NODE_ENV = 'test';

var test = require("unit.js");
var promise = require("promise");

describe("DB Lib", function() {

	var db = require("./lib/db");

	it("initialisation", function(done) {

		db.init().then(function() {
			
			
			_.each(db.managers, function(value, key, list) {

			});

			return db.close();

		}).done(done);

	});
});

describe("API Lib", function() {



});