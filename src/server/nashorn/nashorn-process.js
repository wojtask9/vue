
export function nextTick (fn) {
  var args = [].slice.call(arguments, 1, arguments.length)
  setTimeout(function () {
    fn.apply(this, args)
  }, 0)
}

var performance = global.performance || {}
var performanceNow =
    performance.now =
    function () { return (new Date()).getTime() }

function hrtime (previousTimestamp) {
  var clocktime = performanceNow.call(performance) * 1e-3
  var seconds = Math.floor(clocktime)
  var nanoseconds = Math.floor((clocktime % 1) * 1e9)
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0]
    nanoseconds = nanoseconds - previousTimestamp[1]
    if (nanoseconds < 0) {
      seconds--
      nanoseconds += 1e9
    }
  }
  return [seconds, nanoseconds]
}
global.process = {
  env: {}
}
global.process.nextTick = nextTick
global.process.hrtime = hrtime

export default global.process
