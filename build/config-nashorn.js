const path = require('path')
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const replace = require('rollup-plugin-replace')
const flow = require('rollup-plugin-flow-no-whitespace')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const builtins = require('rollup-plugin-node-builtins')
const version = process.env.VERSION || require('../package.json').version
const weexVersion = process.env.WEEX_VERSION || require('../packages/weex-vue-framework/package.json').version

const banner =
    '/*!\n' +
    ' * Vue.js v' + version + '\n' +
    ' * (c) 2014-' + new Date().getFullYear() + ' Evan You\n' +
    ' * Released under the MIT License.\n' +
    ' */'

const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}

const builds = {
  // Web server renderer for Nashorn (UMD).
  'web-server-renderer-nashorn': {
    entry: resolve('server/nashorn/server-renderer-nashorn.js'),
    dest: resolve('packages/vue-server-renderer-nashorn/vue-nashorn.js'),
    format: 'cjs',
    alias: {
      path: resolve('server/nashorn/nashorn-paths.js'),
      //process: resolve('server/nashorn/nashorn-process.js')
    },
    env: 'production',
    uglify: false,
    banner: 'var global = this;\n' +
            'var module = this;\n' +
            'var exports = this;\n',
    plugins: [
      replace({
        exclude: [
          'node_modules/he/**',
          './src/server/template-renderer/index.js'
        ],
        values: {
          'MAX_STACK_DEPTH =': 'MAX_STACK_DEPTH = 190 ||'
         // window: 'undefined'
        }
      }),
      nodeResolve({
        nextjs: true,
        preferBuiltins: true,
        main: true
      }),
      commonjs({
        include: 'node_modules/**',
        namedExports: {
          'node_modules/he/he.js': ['decode', 'escape'],
          'node_modules/serialize-javascript/index.js': ['serialize']
        }
      }),
      builtins()
    ]
  },
  // Compile nashorn tests (CommonJS).
  'ssr-nashorn-tests': {
    entry: resolve('test/nashorn/nashorn-tests-entry.js'),
    dest: resolve('test/nashorn/ssr-test.spec-nashorn.js'),
    alias: {
      '../../packages/vue-server-renderer': resolve('packages/vue-server-renderer-nashorn/nashorn-export.js'),
      '../../dist/vue.runtime.common.js': resolve('packages/vue-server-renderer-nashorn/nashorn-export.js')
    },
    format: 'cjs',
    context: 'this',
    plugins: [
      nodeResolve({
        nextjs: true,
        preferBuiltins: true
      }),
      commonjs({
        include: 'node_modules/**'
      }),
      builtins()
    ]
  },
    // Compile nashorn tests (CommonJS).
  'ssr-nashorn-benchmark': {
    entry: resolve('benchmarks/nashorn/nashorn-benchmark-entry.js'),
    dest: resolve('benchmarks/nashorn/benchmark-nashorn-string-stream.js'),
    format: 'cjs'
  }
}

function genConfig (opts) {
  const config = {
    entry: opts.entry,
    dest: opts.dest,
    external: opts.external,
    format: opts.format,
    banner: opts.banner,
    moduleName: 'Vue',
    context: opts.context,
    uglify: opts.uglify,
    plugins: [
      replace({
        __WEEX__: !!opts.weex,
        __WEEX_VERSION__: weexVersion,
        __VERSION__: version
      }),
      flow(),
      buble(),
      alias(Object.assign({}, aliases, opts.alias))
    ].concat(opts.plugins || [])
  }

  if (opts.env) {
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  return config
}

if (process.env.TARGET) {
  module.exports = genConfig(builds[process.env.TARGET])
} else {
  exports.getBuild = name => genConfig(builds[name])
  exports.getAllBuilds = () => Object.keys(builds).map(name => genConfig(builds[name]))
}
