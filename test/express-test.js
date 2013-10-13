// Learning how to use express

var assert = require("assert");
var _ = require("underscore");
var should = require("should");
var express = require('express');
var superagent = require('superagent');


describe("POST, PUT, DELETE and GET data using REST with express",function(){
  
	var app;
	var server;

	// Before test suite
	before(function(done){
	  app = express();
	  server = app.listen(3000);
	  app.use(express.bodyParser());
	  done();
	});


	// After test suite
	after(function(done){
		server.close();
		done();
	});

	var user = {
		firstname : "Aaron", 
		lastname : "West", 
		mobile : "0112345678", 
		male : true,
		age : 21
	};

	it("Should post some data and get back an object with an id", function(done){
		
		app.post('/bloggie', function(req, res) {		  
		   var result = _.extend(_.clone(req.body),{id : 1});
		  res.send(result);
		});

		superagent.post('http://localhost:3000/bloggie')
			.send(user)
			.end(function(e,res){
				should.strictEqual(null, e);
				should(res.body).have.property('firstname', "Aaron");
				should(res.body).have.property('lastname', 'West');
				should(res.body).have.property('mobile', "0112345678");
				should(res.body).have.property('male', true);
				should(res.body).have.property('age', 21);
				should(res.body).have.property('id', 1);	        
				done();
			});
		});

	it("Should get back some data by id", function(done){
		app.get('/bloggie/:id', function(req,res){
			res.send(user);
		});

		superagent.get('http://localhost:3000/bloggie/1')
			.end(function(e,res){
				should.strictEqual(null, e);
				should(res.body).have.property('firstname', "Aaron");
				should(res.body).have.property('lastname', 'West');
				should(res.body).have.property('mobile', "0112345678");
				should(res.body).have.property('male', true);
				should(res.body).have.property('age', 21);	        
				done();
			});
	});


	it("Should update data by id", function(done){
		app.put('/bloggie/:id', function(req,res){
			var result = _.extend(_.clone(user),req.body);
			res.send(result);
		});

		superagent.put('http://localhost:3000/bloggie/1')
			.send({age : 26})
			.end(function(e,res){
				should.strictEqual(null, e);
				should(res.body).have.property('firstname', "Aaron");
				should(res.body).have.property('lastname', 'West');
				should(res.body).have.property('mobile', "0112345678");
				should(res.body).have.property('male', true);
				should(res.body).have.property('age', 26);	        
				done();
			});
	});


});





