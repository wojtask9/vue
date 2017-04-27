/* eslint-disable no-unused-vars */

'use strict'

process.env.NODE_ENV = 'production'

import Vue from '../../packages/vue-server-renderer-nashorn/nashorn-export.js'
import { createRenderer } from '../../packages/vue-server-renderer-nashorn/nashorn-export.js'
import { gridComponent } from './common.js'

const renderToStream = createRenderer().renderToStream

console.log('--- renderToStream --- ')
const self = (global || root)
const s = self.performance.now()

const stream = renderToStream(new Vue(gridComponent))
let str = ''
let first
let complete
stream.once('data', () => {
  first = self.performance.now() - s
})
stream.on('data', chunk => {
  str += chunk
})
stream.on('end', () => {
  complete = self.performance.now() - s
  console.log(`first chunk: ${first.toFixed(2)}ms`)
  console.log(`complete: ${complete.toFixed(2)}ms`)
  console.log()
})
