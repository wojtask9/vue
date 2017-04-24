
export default global.process
export function nextTick (fn) {
  var args = [].slice.call(arguments, 1, arguments.length)
  setTimeout(function() {
    fn.apply(this, args)
  }, 0);
}
