
function Time() {
	this.second = 1000;
	this.minute = 60 * this.second;
	this.hour = 60 * this.minute;
	this.day = 24 * this.hour;
	this.month = 30 * this.day;
	this.year = 365 * this.month;
}

module.exports = new Time();
