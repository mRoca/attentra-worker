
function Config() {
	this.name = "attentra-worker";
	this.server = "http://tests.triotech.fr/attentra/web/";

	this.production 	= process.env.NODE_ENV === 'production';
	this.test 			= process.env.NODE_ENV === 'test';
	this.development 	= !this.production && !this.test;
};

module.exports = new Config();
