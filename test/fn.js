/*jshint node:true */
/*global describe:false, it:false */

"use strict";

var gulpif = require('../');
var through = require('through');
require('should');
require('mocha');

describe('gulp-if', function() {
	describe('when given a boolean function,', function() {
		var tempFile = './temp.txt';
		var tempFileContent = 'A test generated this file and it is safe to delete';

		it('should call the function when bool function satisfies', function(done){

			var filter = function(file) { return file.path % 2 === 0; };

			var collect = [];

			var stream = through(function (file) {
				var num = file.path;

				(num % 2).should.equal(0);
				collect.push(num);

				return this.queue(file);
			});

			var s = gulpif(filter, stream);

			var n = 5;

			// Assert
			s.once('end', function(){

				// Test that command executed
				collect.length.should.equal(3);
				collect.indexOf(4).should.equal(0);
				collect.indexOf(2).should.equal(1);
				collect.indexOf(0).should.equal(2);
				done();
			});

			// Act
			while(n > 0) {
				n--;
				s.write({
					path:n
				});
			}

			s.end();
		});

		it('should call the function and branch whenever bool function satisfies', function(done){

			var filter = function(file) { return file.path % 2 === 0; };

			var collect = [];

			var stream = through(function (file) {
				var num = file.path;

				(num % 2).should.equal(0);
				collect.push(num);

				return this.queue(file);
			});


			var mainStream = through(function(num) {
				filter(num).should.equal(false);
			});

			var s = gulpif(filter, stream, true);

				s.pipe(mainStream);

			var n = 5;

			// Assert
			s.on('data', function(data) {
				filter(data).should.equal(false);
			});

			s.once('end', function(){
				// Test that command executed

				collect.length.should.equal(3);
				collect.indexOf(4).should.equal(0);
				collect.indexOf(2).should.equal(1);
				collect.indexOf(0).should.equal(2);
				done();
			});

			// Act
			while(n > 0) {
				n--;
				s.write({
					path:n
				});
			}

			s.end();
		});

		it('should call the function when passed truthy', function(done) {
			// Arrange
			var condition = function() { return true; };
			var called = 0;
			var fakeFile = {
				path: tempFile,
				contents: new Buffer(tempFileContent)
			};

			var changedContent = 'changed_content';

			var s = gulpif(condition, through(function (file) {

				// Test that file got passed through
				file.should.equal(fakeFile);

				called++;

				// do simple file transform
				file.contents = new Buffer(changedContent);

				return this.queue(file);
			}));

			// ensure file is passed correctly
			s.pipe(through(function(data){

				data.should.equal(fakeFile);
				data.contents.toString().should.equal(changedContent);

				called++;
				return this.queue(data);
			}));

			// Assert
			s.once('end', function(){

				// Test that command executed
				called.should.equal(2);
				done();

			});

			// Act
			s.write(fakeFile);
			s.end();
		});

		it('should not call the function when passed falsey', function(done) {
			// Arrange
			var condition = function() { return false; };
			var called = 0;
			var fakeFile = {
				path: tempFile,
				contents: new Buffer(tempFileContent)
			};

			var s = gulpif(condition, through(function (file) {

				// Test that file got passed through
				file.should.equal(fakeFile);

				called++;
				return this.queue(file);
			}));

			// Assert
			s.once('end', function(){

				// Test that command executed
				called.should.equal(0);
				done();
			});

			// Act
			s.write(fakeFile);
			s.end();
		});
	});
});
