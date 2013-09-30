// Data access object

(function() {

	var root = this;

	// Create a safe reference to the rethinkdb object for use below.
	var rethinkdb = function(obj) {
		if (obj instanceof rethinkdb) return obj;
		if (!(this instanceof rethinkdb)) return new rethinkdb(obj);
		this.rethinkdbWrapped = obj;
	};

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
		  exports = module.exports = rethinkdb;
		}
		exports.rethinkdb = rethinkdb;
	} else {
		root.rethinkdb = rethinkdb;
	}

	// Connect to rethinkdb

	rethinkdb.db = require('rethinkdb');
	rethinkdb.connection = null;

	rethinkdb.db.connect( {host: 'localhost', port: 28015}, function(err, conn) {
	    if (err) throw err;
	    rethinkdb.connection = conn;
	});


}).call(this);


