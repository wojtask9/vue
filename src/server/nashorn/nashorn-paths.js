/* @flow */

export function extname (path) {
  console.log('path.extname', path)
  return path
}

export function isAbsolute (path) {
  console.log('path.isAbsolute', path)
  return true
}

export function join () {
  if (arguments.length === 0) {
    return '.'
  }
  console.log('path.join', arguments)
  return '.'
}

export function dirname (path) {
  console.log('path.dirname', path)
  return path
}

// export { filesystem };
// export { filesystem.extname }
