/* @flow */

process.env.VUE_ENV = 'server'

import './nashorn-polyfill.js'
import awaitServer from './awaitServer.js'
import Vue from './../../platforms/web/runtime-with-compiler'
import { createRenderer as _createRenderer } from 'server/create-renderer'
// import { createBundleRendererCreator } from 'server/bundle-renderer/create-bundle-renderer'
import { isUnaryTag, canBeLeftOpenTag } from 'web/compiler/util'
import modules from 'web/server/modules/index'
import baseDirectives from 'web/server/directives/index'

function createRenderer (options?: Object = {}): {
    renderToString: Function,
    renderToStream: Function
} {
  const renderer = _createRenderer(Object.assign({}, options, {
    isUnaryTag,
    canBeLeftOpenTag,
    modules,
    // user can provide server-side implementations for custom directives
    // when creating the renderer.
    directives: Object.assign(baseDirectives, options.directives)
  }))

  return {
    renderToString: function (component, done, context) {
      var results = awaitServer((complete) => {
        renderer.renderToString(component, (err, res) => {
          complete(err, res)
        }, context)
      })

      done(results.error, results.result)
      return results
    },
    renderToStream: function (component, context) {
      return renderer.renderToStream(component, context)
    }
  }
}

export { Vue, createRenderer }

// export const createBundleRenderer = createBundleRendererCreator(createRenderer)
