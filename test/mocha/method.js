"use strict";

var assert = require("assert");
var testUtils = require("./helpers/util.js");


var obj = {};
var error = new Error();
var thrower = Promise.method(function() {
    throw error;
});;

var identity = Promise.method(function(val) {
    return val;
});

var array = Promise.method(function() {
    return [].slice.call(arguments);
});

var receiver = Promise.method(function() {
    return this;
});



describe("Promise.method", function(){
    specify("should reject when the function throws", function(done) {
        var async = false;
        thrower().then(assert.fail, function(e) {
            assert(async);
            assert(e === error);
            done();
        });
        async = true;
    });
    specify("should throw when the function is not a function", function(done) {
        try {
            Promise.method(null);
        }
        catch (e) {
            assert(e instanceof TypeError);
            done();
        }
    });
    specify("should call the function with the given receiver", function(done){
        var async = false;
        receiver.call(obj).then(function(val) {
            assert(async);
            assert(val === obj);
            done();
        }, assert.fail);
        async = true;
    });
    specify("should call the function with the given value", function(done){
        var async = false;
        identity(obj).then(function(val) {
            assert(async);
            assert(val === obj);
            done();
        }, assert.fail);
        async = true;
    });
    specify("should apply the function if given value is array", function(done){
        var async = false;
        array(1, 2, 3).then(function(val) {
            assert(async);
            assert.deepEqual(val, [1,2,3]);
            done();
        }, assert.fail);
        async = true;
    });

    specify("should unwrap returned promise", function(done){
        var d = Promise.defer();

        Promise.method(function(){
            return d.promise;
        })().then(function(v){
            assert(v === 3);
            done();
        })

        setTimeout(function(){
            d.fulfill(3);
        }, 13);
    });
    specify("should unwrap returned thenable", function(done){

        Promise.method(function(){
            return {
                then: function(f, v) {
                    f(3);
                }
            }
        })().then(function(v){
            assert(v === 3);
            done();
        });
    });

    specify("should unwrap a following promise", function(done) {
        var resolveF;
        var f = new Promise(function() {
            resolveF = arguments[0];
        });
        var v = new Promise(function(f) {
            setTimeout(function() {
                f(3);
            }, 13);
        });
        resolveF(v);
        Promise.method(function(){
            return f;
        })().then(function(v){
            assert(v === 3);
            done();
        });
    });

    specify("zero arguments length should remain zero", function(done) {

        Promise.method(function(){
            assert(arguments.length === 0);
            done();
        })();
    });
    specify("should retain binding from returned promise", function(done) {
        var THIS = {};
        Promise.method(function() {
            return Promise.bind(THIS, 1);
        })().then(function(value) {
            assert.strictEqual(THIS, this);
            assert.strictEqual(1, value);
            done();
        });
    });
});
