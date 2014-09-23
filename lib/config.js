
function Config() {
	this.production 	= process.env.NODE_ENV === 'production';
	this.test 			= process.env.NODE_ENV === 'test';
	this.development 	= !this.production && !this.test;
	
	this.name 		= "attentra-worker";
	this.server 	= "http://tests.triotech.fr/attentra/web/";
	this.db 		= this.test ? ":memory:" : "db/db.sqlite";
};

module.exports = new Config();
