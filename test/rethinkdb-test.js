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


var createUUID = function() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}





// Beginning of test suites


describe('How to use rethinkdb', function(){
  
  
  var connection = null;


  // Before test suite
  before(function(done){
    console.log(" ## Before ## ");

    this.timeout(5000);

    r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
      if (err) return done(err);
      connection = conn;

      dbSetup( connection, "bloggie_test", done );

      done();
    });
  });


  // After test suite
  after(function(done){
    dropDb(connection,"bloggie_test");

    if(connection){
      connection.close();
    }

    done();
  });


  describe('create a table called users and insert, update, replace and delete data', function(){

      // setup

      var user1 = {
        firstname : "Aaron", 
        lastname : "West", 
        mobile : "0112345678", 
        male : true,
        age : 21, 
        timestamp : new Date().getTime(),
        id : '9cb94be6-d9b5-4d3a-8858-ff2331b71d5b'
      };

      var user2 = {
        firstname : "Yulia", 
        lastname : "West", 
        mobile : "0112345678", 
        male : false,
        age : 25, 
        timestamp : new Date().getTime(),
        id : '9cb94be6-d9b5-4d3a-8858-ff2331b71d5c'
      };

      var user3 = {
        firstname : "Sebastien", 
        lastname : "West", 
        mobile : "0112345678", 
        male : true,
        age : 4, 
        timestamp : new Date().getTime(),
        id : '9cb94be6-d9b5-4d3a-8858-ff2331b71d5d'
      };

      var users = [user1, user2, user3];




      // Create a table

      it('should create a table called users', function(done){
        r.tableCreate("users").run(connection, function(err, result) {
          if (err) throw done(err);
          result.should.have.property('created', 1);
          done(); 
        });
      });

      // Insert 1 item

      it('should be able to insert data into users table', function(done){
        
        r.table("users")
         .insert( user1, {upsert: true, return_vals: true})
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should.exist(result.new_val.id);
            assertObject( user1, result.new_val );
            
            done();
         });
      });

      // Insert 3 item

      it('should be able to insert multiple items at once', function(done){
        
        r.table("users")
         .insert( users, {upsert: true})
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should(result).have.property('unchanged', 1);
            should(result).have.property('inserted', 2);

            done();
         });
      });

      // Update 1 item

      it('should be able to update a single item', function(done){
        
        r.table("users").get(user1.id)
         .update({age : 30})
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should(result).have.property('replaced', 1);
            should(result).have.property('unchanged', 0);
            should(result).have.property('skipped', 0);
            done();
         });
      });

      // Update multiple items

      it('should be able to update multiple items', function(done){
        
        r.table("users").filter(r.row('male').eq(true))
         .update({mobile : 07555588888})
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should(result).have.property('replaced', 2);
            should(result).have.property('unchanged', 0);
            should(result).have.property('skipped', 0);
            done();
         });
      });

      // Replace entire docos

      it('should be able to replace entire docos', function(done){
        var user1Clone = _.clone(user1);
        user1Clone.firstname="Superman";

        r.table("users")
        .get(user1.id)
        .replace(user1Clone)
         .run(connection, function(err, result){
            if (err) throw done(err);

            // Assert
            should(result).have.property('replaced', 1);
            should(result).have.property('unchanged', 0);
            should(result).have.property('inserted', 0);
            should(result).have.property('deleted', 0);
            done();
         });
      });


      // Merge doco using replace

      it('should be able to merge old with new attributes', function(done){

          r.table('users')
            .get(user1.id)
            .replace(function(doc) {return doc.merge({is_fav: true})}, { return_vals: true })
            .run(connection, function(err, result){                
                if (err) throw err;

                // Assert
                should(result).have.property('replaced', 1);
                should(result).have.property('unchanged', 0);
                should(result).have.property('inserted', 0);
                should(result).have.property('deleted', 0);
                should(result).have.property('errors', 0);
                done();
            });

      });


      // Delete a document

      it('should be delete a document', function(done){

          r.table('users')
            .get(user1.id).delete()
            .run(connection, function(err, result){                
                if (err) throw err;

                // Assert
                should(result).have.property('skipped', 0);
                should(result).have.property('deleted', 1);
                should(result).have.property('errors', 0);
                done();
            });

      });

      // Delete more then one document

      it('should be delete multiple documents', function(done){

          r.table('users')
            .getAll(user2.id,user3.id).delete()
            .run(connection, function(err, result){                
                if (err) throw err;

                // Assert
                should(result).have.property('skipped', 0);
                should(result).have.property('deleted', 2);
                should(result).have.property('errors', 0);
                done();
            });

      });


  });




  describe('Query data from users table', function(){

      var users = [];
      

      beforeEach(function(done){
        this.timeout(5000);

        var firstnameArr = ["Aaron", "Sebastien", "Julia", "Scarlet"];
        var lastnameArr = ["East","West","South","North"];
        var maleArr = [true,true,false,false];
        var mobileArr = ["075123456789","075123456788","075123456777","075123456666"];
        var age = 15;
        users = [];

        _.each(firstnameArr, function( name, index ){
            
            _.each(lastnameArr, function(lastname){
                var item = {
                    firstname : name,
                    lastname : lastname,
                    male : maleArr[index],
                    mobile : mobileArr[index],
                    age : age++,
                    id : createUUID()
                };

                users.push(item);
            });
        });

        r.table('users').delete({durability: 'hard'})
            .run(connection,function(err, result){
              if(err) throw err;

              r.table('users')
                .insert(users,{durability: 'hard', upsert : true})
                .run(connection, function(err,result){
                  if(err) throw err;

                  should(result).have.property('inserted', 16);
                  
                  done();
                });
            });
            
    });



      // Query 1 item by Id

      it('should be able to retrieve a record from users table', function(done){

        r.table("users")
         .get(users[0].id)
         .run(connection, function(err, result){
            if (err) throw err;

            // Assert
            assertObject( users[0], result );            
            done();
         });

      });

      it('should be able to retrieve users between ages 20 and 24', function(done){
        
        r.table("users").indexCreate('age').run(connection, function(err, result){
            if (err) throw err;

            r.table("users")
             .between(users[0].age, users[5].age, {'index' : 'age', 'right_bound':'closed'})
             .run(connection, function(err, cursor){
                if (err) throw err;

                var results = [];

                cursor.toArray(function(err, result) {
                  if (err) throw err;
                  results = result;
                });

                // Assert
                results.should.have.lengthOf(6)

                // remove index 
                r.table("users").indexDrop('age').run(connection, function(err, result){
                    if (err) throw err;

                    done();
                });
                
             });

        });

      }); 

      // it('should be able to retrieve records from users table', function(done){

      //   r.table("users")
      //    .insert(users, {upsert: true})
      //    .run(connection, function(err,result){
      //       if (err) throw done(err);
      //    });

      //   r.table("users")
      //    .getAll('male')
      //    .run(connection, function(err, result){
      //       if (err) throw done(err);

      //       console.log("getAll arguments", arguments);

      //       // Assert
      //       assertObject( user1, result );            
      //       done();
      //    });

      // });      


      // it('should be able to filter by a value to retrieve a record from users table', function(done){
        
      //   r.table("users")
      //    .insert( user2, {upsert: true})
      //    .run(connection, function(err){
      //       if (err) throw done(err);
      //    });

      //    r.table("users").filter({ male : true}).run( connection, function(err, result){
      //         if (err) throw done(err);

      //         console.log("filter result",result);

      //         // assertObject( user1, result );
      //         done();
      //       }); 

      // });
  });


});
