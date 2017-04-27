'use strict'

process.env.NODE_ENV = 'production'

import Vue from '../../packages/vue-server-renderer-nashorn/nashorn-export.js'
import { createRenderer } from '../../packages/vue-server-renderer-nashorn/nashorn-export.js'
const renderToString = createRenderer().renderToString

import { gridComponent } from './common.js'

console.log('--- renderToString --- ')
const self = (global || root)
for (let i = 0; i < 10; i++) {
  self.s = self.performance.now()

  renderToString(new Vue(gridComponent), () => {
    console.log('#' + i + ' Complete time: ' + (self.performance.now() - self.s).toFixed(2) + 'ms')
    console.log()
  })
}
