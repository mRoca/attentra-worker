var crypto = require("crypto");
var db = require("./lib/db");

db.init().done(main);

function main() {
	// Simulate Badging
	var identifier = "'" + crypto.randomBytes(10).toString("base64") + "'";
	var datetime = "'" + (new Date).toISOString() + "'";
	db.presence.create({identifier: identifier, datetime: datetime});
}