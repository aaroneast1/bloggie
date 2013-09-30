// r basic API calls

console.log("running tests....");

var assert = require("assert");
var _ = require("underscore");
var r = require("rethinkdb");
var should = require("should");

var errorCallback = function( err, result ){
  if (err) return done(err);
};

var createDb = function( connection, dbName ){
  r.dbCreate(dbName).run(connection, function(err, result) {
    if (err) return done(err);
  });
};

var dropDb = function( connection, dbName ){
  r.dbDrop(dbName).run(connection, function(err, result) {
    if (err) return done(err);
  });
};

var dropTables = function( connection, dbName ){
  r.tableList().run(connection, function( err, tables ){
    if (err) return done(err);
  
    _.each(tables, function( t ){
      r.db(dbName).tableDrop(t).run(connection, errorCallback);
    });

  });
};

var dbSetup = function( connection, dbName ){
  r.dbList().run(connection, function( err, dbs ){
    if(_.contains(dbs, dbName)){
        dropDb( connection, dbName );
    }
    createDb( connection, dbName );
    connection.use(dbName);
  });
};

var assertObject = function( expected, result ){
  var keys = _.keys(expected);

  _.each(keys, function(key){
    should(result).have.property(key, expected[key]);
  });

};


describe('How to use rethinkdb', function(){
  var connection = null;

  before(function(done){
    this.timeout(5000);

    r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
      if (err) return done(err);
      connection = conn;

      dbSetup( connection, "bloggie_test", done );

      done();
    });
  });

  beforeEach(function(done){
    this.timeout(3000);
    
    dropTables( connection, "bloggie_test" );
    done();

  });


  describe('create a table, update data, find data', function(){

      var expected = {
        firstname : "Aaron", 
        lastname : "East", 
        mobile : "07525811799", 
        male : true, 
        timestamp : new Date().getTime()
      };

      it('should create a table called bloggie.users', function(done){
        r.tableCreate("users").run(connection, function(err, result) {
          if (err) throw done(err);
          result.should.have.property('created', 1);
          done(); 
        });
      });

      it('should be able to insert data into users table', function(done){
        
        r.table("users")
         .insert( expected, {upsert: true, return_vals: true})
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should.exist(result.new_val.id);
            assertObject( expected, result.new_val );
            
            done();
         });
      });

      it('should be able to retrieve data from users table', function(done){
          done();
      });


  });


});
