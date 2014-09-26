
function Config() {
	this.env 			= process.env.NODE_ENV || "";
	this.production 	= this.env.indexOf('production') === 0;
	this.test 			= this.env.indexOf('test') === 0;
	this.development 	= !this.production && !this.test;
	
	this.name 		= "attentra-worker";
	this.server 	= "http://tests.triotech.fr/attentra/web/";
	this.db 		= this.test ? ":memory:" : "db/db.sqlite";
};

module.exports = new Config();
