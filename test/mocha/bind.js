"use strict";
var assert = require("assert");
var testUtils = require("./helpers/util.js");

function timedThenableOf(value) {
    return {
        then: function(onFulfilled) {
            setTimeout(function() {
                onFulfilled(value);
            }, 13);
        }
    };
}

function timedPromiseOf(value) {
    return Promise.delay(value, 13);
}

function immediatePromiseOf(value) {
    return Promise.resolve(value);
}

function immediateThenableOf(value) {
    return {
        then: function(onFulfilled) {
            onFulfilled(value);
        }
    };
}

function timedRejectedThenableOf(value) {
    return {
        then: function(onFulfilled, onRejected) {
            setTimeout(function() {
                onRejected(value);
            }, 13);
        }
    };
}

function timedRejectedPromiseOf(value) {
    return Promise.delay(13).then(function() {
        throw value;
    });
}

function immediateRejectedPromiseOf(value) {
    return Promise.reject(value);
}

function immediateRejectedThenableOf(value) {
    return {
        then: function(onFulfilled, onRejected) {
            onRejected(value);
        }
    };
}

function toValue(valueOrPromise) {
    if (valueOrPromise && typeof valueOrPromise.value === "function") {
        return valueOrPromise.value();
    }
    return valueOrPromise
}

var THIS = {name: "this"};

function CustomError1() {}
CustomError1.prototype = Object.create(Error.prototype);
function CustomError2() {}
CustomError2.prototype = Object.create(Error.prototype);


describe("when using .bind", function() {
    describe("with finally", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function(done) {
                Promise.resolve().bind(THIS).lastly(function(){
                    assert(this === THIS);
                    done();
                });
            });

            specify("after promise returned from finally resolves", function(done) {
                var d = Promise.defer();
                var promise = d.promise;
                var waited = false;
                Promise.resolve().bind(THIS).lastly(function(){
                    return promise;
                }).lastly(function(){
                    assert(waited);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    waited = true;
                    d.fulfill();
                }, 50);
            });
        })

    });

    describe("with tap", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function(done) {
                Promise.resolve().bind(THIS).tap(function(){
                    assert(this === THIS);
                    done();
                });
            });

            specify("after promise returned from tap resolves", function(done) {
                var d = Promise.defer();
                var promise = d.promise;
                var waited = false;
                Promise.resolve().bind(THIS).tap(function(){
                    return promise;
                }).tap(function(){
                    assert(waited);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    waited = true;
                    d.fulfill();
                }, 50);
            });
        })

    });

    describe("with timeout", function() {
        describe("this should refer to the bound object", function() {
            specify("in straight-forward handler", function(done) {
                Promise.resolve(3).bind(THIS).timeout(500).then(function(v) {
                    assert(v === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("in rejected handler", function(done) {
                Promise.reject(3).bind(THIS).timeout(500).then(assert.fail, function(v){
                    assert(v === 3);
                    assert(this === THIS);
                    done();
                });
            });

            specify("in rejected handler after timeout", function(done) {
                new Promise(function(){})
                    .bind(THIS).timeout(10).caught(Promise.TimeoutError, function(err){
                    assert(this === THIS);
                    done();
                });
            });
        })

    });

    describe("With catch filters", function() {
        describe("this should refer to the bound object", function() {
            specify("in an immediately trapped catch handler", function(done) {
                Promise.resolve().bind(THIS).then(function(){
                    assert(THIS === this);
                    var a;
                    a.b();
                }).caught(Error, function(e){
                    assert(THIS === this);
                    done();
                });
            });
            specify("in a later trapped catch handler", function(done) {
                Promise.resolve().bind(THIS).then(function(){
                   throw new CustomError1();
                }).caught(CustomError2, assert.fail)
                .caught(CustomError1, function(e){
                    assert(THIS === this);
                    done();
                });
            });
        });
    });

    describe("With uncancellable promises", function(){
        specify("this should refer to the bound object", function(done) {
            Promise.resolve().bind(THIS).uncancellable().then(function(){
                assert(this === THIS);
                done();
            });
        });
    });

    describe("With forked promises", function(){
        specify("this should refer to the bound object", function(done) {
            Promise.resolve().bind(THIS).fork().then(function(){
                assert(this === THIS);
                done();
            });
        });
    });

    describe("With .get promises", function(){
        specify("this should refer to the bound object", function(done) {
            Promise.resolve({key: "value"}).bind(THIS).get("key").then(function(val){
                assert(val === "value");
                assert(this === THIS);
                done();
            });
        });
    });

    describe("With .call promises", function(){
        specify("this should refer to the bound object", function(done) {
            Promise.resolve({key: function(){return "value";}}).bind(THIS).call("key").then(function(val){
                assert(val === "value");
                assert(this === THIS);
                done();
            });
        });
    });


    describe("With .done promises", function(){

        describe("this should refer to the bound object", function() {
            specify("when rejected", function(done) {
                Promise.reject().bind(THIS).done(assert.fail, function(){
                    assert(this === THIS);
                    done();
                });
            });
            specify("when fulfilled", function(done) {
                Promise.resolve().bind(THIS).done(function(){
                    assert(this === THIS);
                    done();
                });
            });
        });
    });

    describe("With .spread promises", function(){

        describe("this should refer to the bound object", function() {
            specify("when spreading immediate array", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("when spreading eventual array", function(done) {
                var d = Promise.defer();
                var promise = d.promise;
                promise.bind(THIS).spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                    done();
                });
                setTimeout(function(){
                    d.fulfill([1,2,3]);
                }, 50);
            });

            specify("when spreading eventual array of eventual values", function(done) {
                var d = Promise.defer();
                var promise = d.promise;
                promise.bind(THIS).spread(function(a, b, c){
                    assert(c === 3);
                    assert(this === THIS);
                    done();
                });
                setTimeout(function(){
                    var d1 = Promise.defer();
                    var p1 = d1.promise;

                    var d2 = Promise.defer();
                    var p2 = d2.promise;

                    var d3 = Promise.defer();
                    var p3 = d3.promise;
                    d.fulfill([p1, p2, p3]);

                    setTimeout(function(){
                        d1.fulfill(1);
                        d2.fulfill(2);
                        d3.fulfill(3);
                    }, 3);
                }, 50);
            });
        });
    });

    describe("With nodeify", function() {
        describe("this should refer to the bound object", function() {
            specify("when the callback succeeeds", function(done) {
                Promise.resolve(3).bind(THIS).nodeify(function(err, success){
                    assert(success === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("when the callback errs", function(done) {
                Promise.reject(3).bind(THIS).nodeify(function(err, success){
                    assert(err === 3);
                    assert(this === THIS);
                    done();
                });
            });
        });
    });


    describe("With map", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the mapper with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).map(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });
            });
            specify("inside the mapper with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).map(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the mapper with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });
            });

            specify("after the mapper with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).map(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the mapper with immediate values when the map returns promises", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).map(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

    describe("With reduce", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the reducer with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).reduce(function(prev, v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });
            });
            specify("inside the reducer with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).reduce(function(prev, v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the reducer with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });
            });

            specify("after the reducer with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).reduce(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the reducer with immediate values when the reducer returns promise", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).reduce(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });


    describe("With filter", function() {
        describe("this should refer to the bound object", function() {
            specify("inside the filterer with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).filter(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });
            });
            specify("inside the filterer with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).filter(function(v, i){
                    if (i === 2) {
                        assert(this === THIS);
                        done();
                    }
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the filterer with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });
            });

            specify("after the filterer with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).filter(function(){
                    return 1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after the filterer with immediate values when the filterer returns promises", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return p1;
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return p1.then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

    describe("With all", function() {
        describe("this should refer to the bound object", function() {
            specify("after all with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).all().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after all with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).all().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.all([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

    describe("With any", function() {
        describe("this should refer to the bound object", function() {
            specify("after any with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).any().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after any with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).any().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.any([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });


    describe("With race", function() {
        describe("this should refer to the bound object", function() {
            specify("after race with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).race().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after race with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).race().then(function(v){
                    assert(v === 1);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.race([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

    describe("With settle", function() {
        describe("this should refer to the bound object", function() {
            specify("after settle with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).settle().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after settle with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).settle().then(function(v){
                    assert(v.length === 3);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.settle([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

    describe("With some", function() {
        describe("this should refer to the bound object", function() {
            specify("after some with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after some with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });

            specify("after some with eventual array for eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                var dArray = Promise.defer();
                var arrayPromise = dArray.promise;

                arrayPromise.bind(THIS).some(2).then(function(v){
                    assert.deepEqual(v, [1,2]);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    dArray.fulfill([p1, p2, p3]);
                    setTimeout(function(){
                        d1.fulfill(1);
                        d2.fulfill(2);
                        d3.fulfill(3);
                    }, 50);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).filter(function(){
                    return Promise.some([p1], 1).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });



    describe("With props", function() {
        describe("this should refer to the bound object", function() {
            specify("after props with immediate values", function(done) {
                Promise.resolve([1,2,3]).bind(THIS).props().then(function(v){
                    assert(v[2] === 3);
                    assert(this === THIS);
                    done();
                });
            });
            specify("after props with eventual values", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                var d2 = Promise.defer();
                var p2 = d2.promise;

                var d3 = Promise.defer();
                var p3 = d3.promise;

                Promise.resolve([p1, p2, p3]).bind(THIS).props().then(function(v){
                    assert(v[2] === 3);
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                    d2.fulfill(2);
                    d3.fulfill(3);
                }, 50);
            });
        });

        describe("this should not refer to the bound object", function() {
            specify("in the promises created within the handler", function(done) {
                var d1 = Promise.defer();
                var p1 = d1.promise;

                Promise.resolve([1,2,3]).bind(THIS).props(function(){
                    return Promise.settle([p1]).then(function(){
                        assert(this !== THIS);
                        return 1;
                    })
                }).then(function(){
                    assert(this === THIS);
                    done();
                });

                setTimeout(function(){
                    d1.fulfill(1);
                }, 50);
            });
        });
    });

});

describe("When using .bind to gratuitously rebind", function() {
    var a = {value: 1};
    var b = {value: 2};
    var c = {value: 3};

    function makeTest(a, b, c) {
        return function(done) {
            var dones = 0;
            function donecalls() {
                if (++dones === 3) done();
            }

            Promise.bind(a).then(function() {
                assert(this.value === 1);
                donecalls();
            }).bind(b).then(function(){
                assert(this.value === 2);
                donecalls();
            }).bind(c).then(function(){
                assert(this.value === 3);
                donecalls();
            });
        }
    }

    specify("should not get confused immediately", makeTest(a, b, c));
    specify("should not get confused immediate thenable",
        makeTest(immediateThenableOf(a), immediateThenableOf(b), immediateThenableOf(c)));
    specify("should not get confused immediate promise",
        makeTest(immediatePromiseOf(a), immediatePromiseOf(b), immediatePromiseOf(c)));
    specify("should not get confused timed thenable",
        makeTest(timedThenableOf(a), timedThenableOf(b), timedThenableOf(c)));
    specify("should not get confused timed promise",
        makeTest(timedPromiseOf(a), timedPromiseOf(b), timedPromiseOf(c)));
});


describe("Promised thisArg", function() {

    var defaultThis = function() {return this}();
    var e = {value: 1};

    specify("basic case, this first", function(done) {
        var thisPromise = Promise.delay(1, 0);
        var promise = Promise.delay(2, 56);
        promise.bind(thisPromise).then(function(val) {
            assert(+this === 1);
            assert(+val === 2);
            done();
        });
    });

    specify("basic case, main promise first", function(done) {
        var thisPromise = Promise.delay(1, 56);
        var promise = Promise.delay(2, 0);
        var a = promise.bind(thisPromise).then(function(val) {
            assert.strictEqual(+this, 1);
            assert.strictEqual(+val, 2);
            done();
        });
    });

    specify("both reject, this rejects first", function(done) {
        var e1 = new Error("e1");
        var e2 = new Error("e2");
        var thisPromise = Promise.delay(1, 0).thenThrow(e1);
        var promise = Promise.delay(2, 56).thenThrow(e2);
        promise.bind(thisPromise).then(null, function(reason) {
            assert(this === defaultThis);
            assert.strictEqual(reason, e1);
            done();
        });
    });

    specify("both reject, main promise rejects first", function(done) {
        var e1 = new Error("first");
        var e2 = new Error("second");
        var thisPromise = Promise.delay(1, 56).thenThrow(e1);
        var promise = Promise.delay(2, 0).thenThrow(e2);
        promise.bind(thisPromise).then(null, function(reason) {
            assert(this === defaultThis);
            assert.strictEqual(reason, e2);
            done();
        });
    });

    specify("root promise is cancelled before binding resolves", function(done) {
        var t = Promise.delay(THIS, 100);
        var ret = new Promise(function() {}).cancellable().bind(t);
        var err = new Error();
        Promise.delay(1).then(function() {
            ret.cancel(err);
        });
        ret.caught(function(e) {
            assert.strictEqual(t.value(), THIS);
            assert.strictEqual(e, err);
            assert.strictEqual(this, THIS);
            done();
        });
    });

    specify("returned promise is cancelled before binding resolves", function(done) {
        var t = Promise.delay(THIS, 100);
        var ret = new Promise(function() {}).bind(t).cancellable();
        var err = new Error();
        Promise.delay(1).then(function() {
            ret.cancel(err);
        });
        ret.caught(function(e) {
            assert.strictEqual(t.value(), THIS);
            assert.strictEqual(e, err);
            assert.strictEqual(this, THIS);
            done();
        });
    });

    specify("Immediate value waits for deferred this", function(done) {
        var t = Promise.delay(THIS, 100);
        var t2 = {};
        Promise.resolve(t2).bind(t).then(function(value) {
            assert.strictEqual(this, THIS);
            assert.strictEqual(t2, value);
            done();
        });
    });


    specify("Immediate error waits for deferred this", function(done) {
        var t = Promise.delay(THIS, 100);
        var err = new Error();
        Promise.reject(err).bind(t).caught(function(e) {
            assert.strictEqual(this, THIS);
            assert.strictEqual(err, e);
            done();
        });
    });


    specify("static promise is cancelled before binding resolves", function(done) {
        var t = Promise.delay(THIS, 100);
        var promise = Promise.bind(t, new Promise(function(){})).cancellable();
        var err = new Error();
        promise.caught(function(e) {
            assert.strictEqual(t.value(), THIS);
            assert.strictEqual(e, err);
            assert.strictEqual(this, THIS);
            done();
        });
        Promise.delay(1).then(function() {
            promise.cancel(err);
        });
    });

    specify("main promise is cancelled before binding rejects", function(done) {
        var tErr = new Error();
        var t = Promise.delay(THIS, 100).thenThrow(tErr);
        var ret = new Promise(function() {}).cancellable().bind(t);
        var err = new Error();
        Promise.delay(1).then(function() {
            ret.cancel(err);
        });

        ret.caught(function(e) {
            assert.strictEqual(e, err);
            done();
        });
    });

    function makeThisArgRejectedTest(reason) {
        return function(done) {

            Promise.bind(reason()).caught(function(e) {
                assert(this === defaultThis);
                assert(e.value === 1);
                done();
            })
        };
    }

    specify("if thisArg is rejected timed promise, returned promise is rejected",
        makeThisArgRejectedTest(function() { return timedRejectedPromiseOf(e); }));
    specify("if thisArg is rejected immediate promise, returned promise is rejected",
        makeThisArgRejectedTest(function() { return immediateRejectedPromiseOf(e); }));
    specify("if thisArg is rejected timed thenable, returned promise is rejected",
        makeThisArgRejectedTest(function() { return timedRejectedThenableOf(e); }));
    specify("if thisArg is rejected immediate thenable, returned promise is rejected",
        makeThisArgRejectedTest(function() { return immediateRejectedThenableOf(e); }));

    function makeThisArgRejectedTestMethod(reason) {
        return function(done) {

            Promise.resolve().bind(reason()).caught(function(e) {
                assert(this === defaultThis);
                assert(e.value === 1);
                done();
            })
        };
    }

    specify("if thisArg is rejected timed promise, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return timedRejectedPromiseOf(e); }));
    specify("if thisArg is rejected immediate promise, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return immediateRejectedPromiseOf(e); }));
    specify("if thisArg is rejected timed thenable, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return timedRejectedThenableOf(e); }));
    specify("if thisArg is rejected immediate thenable, returned promise is rejected",
        makeThisArgRejectedTestMethod(function() { return immediateRejectedThenableOf(e); }));
});

describe("github issue", function() {
    specify("426", function() {
        return Promise.all([Promise.delay(10)]).bind(THIS).spread(function() {
            assert.equal(this, THIS);
        });
    });
});
