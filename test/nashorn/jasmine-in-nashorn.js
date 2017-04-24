#!/opt/oracle-jdk/jdk1.8/bin/jjs -fv


var module = {
    exports : exports
}
var exports = this

load('./packages/vue-server-renderer-nashorn/vue-nashorn.js')

exports = {}
var jasmineRequire = exports
load('./node_modules/jasmine-core/lib/jasmine-core/jasmine.js')

function extend (destination, source) {
  for (var property in source) destination[property] = source[property]
  return destination
}

var jasmine = jasmineRequire.core(jasmineRequire)
var env = jasmine.getEnv()
var jsm = jasmineRequire.interface(jasmine, env)

jasmine.getGlobal().clearTimeout = function (id) {}
jasmine.getGlobal().setInterval = function (fn, delay) {}
jasmine.getGlobal().setTimeout = function (fn, delay) {
  fn()
  return 0
}

extend(this, jsm)

env.addReporter({

  jasmineStarted: function (suiteInfo) {
    console.log('Running suite with ' + suiteInfo.totalSpecsDefined)
  },

  suiteStarted: function (suite) {
    console.log('\n    ' + suite.description + '...')
  },

  specStarted: function (result) {
    console.log('Spec started: ' + result.description + ' whose full description is: ' + result.fullName)
  },

  specDone: function (result) {

    for (var i = 0; i < result.failedExpectations.length; i++) {
      console.log('Failure: ' + result.failedExpectations[i].message)
      console.log(result.failedExpectations[i].stack)
    }
  },

  jasmineDone: function () {
    console.log('Finished suite')
    exit()
  }
})

load('./test/nashorn/ssr-test.spec-nashorn.js')

env.execute()
