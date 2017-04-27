'use strict';

// this is Hack because I don't want modify ssr*-spec.js files

var Vue = global.Vue;
var createRenderer = global.createRenderer;

/*
from https://github.com/substack/vm-browserify/blob/bfd7c5f59edec856dc7efe0b77a4f6b2fa20f226/index.js

MIT license no Copyright holder mentioned
*/


function Object_keys(obj) {
  if (Object.keys) { return Object.keys(obj) }
  else {
    var res = [];
    for (var key in obj) { res.push(key); }
    return res;
  }
}

function forEach(xs, fn) {
  if (xs.forEach) { return xs.forEach(fn) }
  else
    { for (var i = 0; i < xs.length; i++) {
      fn(xs[i], i, xs);
    } }
}
var _defineProp;

function defineProp(obj, name, value) {
  if (typeof _defineProp !== 'function') {
    _defineProp = createDefineProp;
  }
  _defineProp(obj, name, value);
}

function createDefineProp() {
  try {
    Object.defineProperty({}, '_', {});
    return function(obj, name, value) {
      Object.defineProperty(obj, name, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: value
      });
    };
  } catch (e) {
    return function(obj, name, value) {
      obj[name] = value;
    };
  }
}

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
  'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
  'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
  'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
  'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'
];

function Context() {}
Context.prototype = {};

function Script(code) {
  if (!(this instanceof Script)) { return new Script(code); }
  this.code = code;
}
function otherRunInContext(code, context) {
  var args = Object_keys(global);
  args.push('with (this.__ctx__){return eval(this.__code__)}');
  var fn = Function.apply(null, args);
  return fn.apply({
    __code__: code,
    __ctx__: context
  });
}
Script.prototype.runInContext = function(context) {
  if (!(context instanceof Context)) {
    throw new TypeError('needs a \'context\' argument.');
  }
  if (global.document) {
    var iframe = global.document.createElement('iframe');
    if (!iframe.style) { iframe.style = {}; }
    iframe.style.display = 'none';

    global.document.body.appendChild(iframe);

    var win = iframe.contentWindow;
    var wEval = win.eval,
      wExecScript = win.execScript;

    if (!wEval && wExecScript) {
      // win.eval() magically appears when this is called in IE:
      wExecScript.call(win, 'null');
      wEval = win.eval;
    }

    forEach(Object_keys(context), function(key) {
      win[key] = context[key];
    });
    forEach(globals, function(key) {
      if (context[key]) {
        win[key] = context[key];
      }
    });

    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);

    forEach(Object_keys(win), function(key) {
      // Avoid copying circular objects like `top` and `window` by only
      // updating existing context properties or new properties in the `win`
      // that was only introduced after the eval.
      if (key in context || indexOf(winKeys, key) === -1) {
        context[key] = win[key];
      }
    });

    forEach(globals, function(key) {
      if (!(key in context)) {
        defineProp(context, key, win[key]);
      }
    });
    global.document.body.removeChild(iframe);

    return res;
  }
  return otherRunInContext(this.code, context);
};

Script.prototype.runInThisContext = function() {
  var fn = new Function('code', 'return eval(code);');
  return fn.call(global, this.code); // maybe...
};

Script.prototype.runInNewContext = function(context) {
  var ctx = createContext(context);
  var res = this.runInContext(ctx);
  if (context) {
    forEach(Object_keys(ctx), function(key) {
      context[key] = ctx[key];
    });
  }

  return res;
};


function createScript(code) {
  return new Script(code);
}

function createContext(context) {
  if (isContext(context)) {
    return context;
  }
  var copy = new Context();
  if (typeof context === 'object') {
    forEach(Object_keys(context), function(key) {
      copy[key] = context[key];
    });
  }
  return copy;
}
function runInContext(code, contextifiedSandbox, options) {
  var script = new Script(code, options);
  return script.runInContext(contextifiedSandbox, options);
}
function runInThisContext(code, options) {
  var script = new Script(code, options);
  return script.runInThisContext(options);
}
function isContext(context) {
  return context instanceof Context;
}
function runInNewContext(code, sandbox, options) {
  var script = new Script(code, options);
  return script.runInNewContext(sandbox, options);
}
var VM = {
  runInContext: runInContext,
  isContext: isContext,
  createContext: createContext,
  createScript: createScript,
  Script: Script,
  runInThisContext: runInThisContext,
  runInNewContext: runInNewContext
};


/*
from indexOf
@ author tjholowaychuk
@ license MIT
*/
var _indexOf = [].indexOf;

function indexOf(arr, obj){
  if (_indexOf) { return arr.indexOf(obj); }
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) { return i; }
  }
  return -1;
}

var ref = createRenderer();
var renderToString = ref.renderToString;

describe('SSR: renderToString', function () {
  it('static attributes', function (done) {
    renderVmWithOptions({
      template: '<div id="foo" bar="123"></div>'
    }, function (result) {
      expect(result).toContain('<div id="foo" bar="123" data-server-rendered="true"></div>');
      done();
    });
  });

  it('unary tags', function (done) {
    renderVmWithOptions({
      template: '<input value="123">'
    }, function (result) {
      expect(result).toContain('<input value="123" data-server-rendered="true">');
      done();
    });
  });

  it('dynamic attributes', function (done) {
    renderVmWithOptions({
      template: '<div qux="quux" :id="foo" :bar="baz"></div>',
      data: {
        foo: 'hi',
        baz: 123
      }
    }, function (result) {
      expect(result).toContain('<div qux="quux" id="hi" bar="123" data-server-rendered="true"></div>');
      done();
    });
  });

  it('static class', function (done) {
    renderVmWithOptions({
      template: '<div class="foo bar"></div>'
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar"></div>');
      done();
    });
  });

  it('dynamic class', function (done) {
    renderVmWithOptions({
      template: '<div class="foo bar" :class="[a, { qux: hasQux, quux: hasQuux }]"></div>',
      data: {
        a: 'baz',
        hasQux: true,
        hasQuux: false
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar baz qux"></div>');
      done();
    });
  });

  it('custom component class', function (done) {
    renderVmWithOptions({
      template: '<div><cmp class="cmp"></cmp></div>',
      components: {
        cmp: {
          render: function (h) { return h('div', 'test'); }
        }
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true"><div class="cmp">test</div></div>');
      done();
    });
  });

  it('nested component class', function (done) {
    renderVmWithOptions({
      template: '<cmp class="outer" :class="cls"></cmp>',
      data: { cls: { 'success': 1 }},
      components: {
        cmp: {
          render: function (h) { return h('div', [h('nested', { staticClass: 'nested', 'class': { 'error': 1 }})]); },
          components: {
            nested: {
              render: function (h) { return h('div', { staticClass: 'inner' }, 'test'); }
            }
          }
        }
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true" class="outer success">' +
          '<div class="inner nested error">test</div>' +
        '</div>');
      done();
    });
  });

  it('dynamic style', function (done) {
    renderVmWithOptions({
      template: '<div style="background-color:black" :style="{ fontSize: fontSize + \'px\', color: color }"></div>',
      data: {
        fontSize: 14,
        color: 'red'
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="background-color:black;font-size:14px;color:red;"></div>'
      );
      done();
    });
  });

  it('dynamic string style', function (done) {
    renderVmWithOptions({
      template: '<div :style="style"></div>',
      data: {
        style: 'color:red'
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"></div>'
      );
      done();
    });
  });

  it('auto-prefixed style value as array', function (done) {
    renderVmWithOptions({
      template: '<div :style="style"></div>',
      data: {
        style: {
          display: ['-webkit-box', '-ms-flexbox', 'flex']
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="display:-webkit-box;display:-ms-flexbox;display:flex;"></div>'
      );
      done();
    });
  });

  it('custom component style', function (done) {
    renderVmWithOptions({
      template: '<section><comp :style="style"></comp></section>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div></div>'
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<section data-server-rendered="true"><div style="color:red;"></div></section>'
      );
      done();
    });
  });

  it('nested custom component style', function (done) {
    renderVmWithOptions({
      template: '<comp style="color: blue" :style="style"></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<nested style="text-align: left;" :style="{fontSize:\'520rem\'}"></nested>',
          components: {
            nested: {
              template: '<div></div>'
            }
          }
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="text-align:left;font-size:520rem;color:red;"></div>'
      );
      done();
    });
  });

  it('component style not passed to child', function (done) {
    renderVmWithOptions({
      template: '<comp :style="style"></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div><div></div></div>'
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"><div></div></div>'
      );
      done();
    });
  });

  it('component style not passed to slot', function (done) {
    renderVmWithOptions({
      template: '<comp :style="style"><span style="color:black"></span></comp>',
      data: {
        style: 'color:red'
      },
      components: {
        comp: {
          template: '<div><slot></slot></div>'
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" style="color:red;"><span style="color:black;"></span></div>'
      );
      done();
    });
  });

  it('attrs merging on components', function (done) {
    var Test = {
      render: function (h) { return h('div', {
        attrs: { id: 'a' }
      }); }
    };
    renderVmWithOptions({
      render: function (h) { return h(Test, {
        attrs: { id: 'b', name: 'c' }
      }); }
    }, function (res) {
      expect(res).toContain(
        '<div id="b" data-server-rendered="true" name="c"></div>'
      );
      done();
    });
  });

  it('domProps merging on components', function (done) {
    var Test = {
      render: function (h) { return h('div', {
        domProps: { innerHTML: 'a' }
      }); }
    };
    renderVmWithOptions({
      render: function (h) { return h(Test, {
        domProps: { innerHTML: 'b', value: 'c' }
      }); }
    }, function (res) {
      expect(res).toContain(
        '<div data-server-rendered="true" value="c">b</div>'
      );
      done();
    });
  });

  it('v-show directive render', function (done) {
    renderVmWithOptions({
      template: '<div v-show="false"><span>inner</span></div>'
    }, function (res) {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      );
      done();
    });
  });

  it('v-show directive not passed to child', function (done) {
    renderVmWithOptions({
      template: '<foo v-show="false"></foo>',
      components: {
        foo: {
          template: '<div><span>inner</span></div>'
        }
      }
    }, function (res) {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      );
      done();
    });
  });

  it('v-show directive not passed to slot', function (done) {
    renderVmWithOptions({
      template: '<foo v-show="false"><span>inner</span></foo>',
      components: {
        foo: {
          template: '<div><slot></slot></div>'
        }
      }
    }, function (res) {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;"><span>inner</span></div>'
      );
      done();
    });
  });

  it('v-show directive merging on components', function (done) {
    renderVmWithOptions({
      template: '<foo v-show="false"></foo>',
      components: {
        foo: {
          render: function (h) { return h('bar', {
            directives: [{
              name: 'show',
              value: true
            }]
          }); },
          components: {
            bar: {
              render: function (h) { return h('div', 'inner'); }
            }
          }
        }
      }
    }, function (res) {
      expect(res).toContain(
        '<div data-server-rendered="true" style="display:none;">inner</div>'
      );
      done();
    });
  });

  it('text interpolation', function (done) {
    renderVmWithOptions({
      template: '<div>{{ foo }} side {{ bar }}</div>',
      data: {
        foo: 'server',
        bar: '<span>rendering</span>'
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true">server side &lt;span&gt;rendering&lt;/span&gt;</div>');
      done();
    });
  });

  it('v-html', function (done) {
    renderVmWithOptions({
      template: '<div v-html="text"></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true"><span>foo</span></div>');
      done();
    });
  });

  it('v-text', function (done) {
    renderVmWithOptions({
      template: '<div v-text="text"></div>',
      data: {
        text: '<span>foo</span>'
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true">&lt;span&gt;foo&lt;/span&gt;</div>');
      done();
    });
  });

  it('child component (hoc)', function (done) {
    renderVmWithOptions({
      template: '<child class="foo" :msg="msg"></child>',
      data: {
        msg: 'hello'
      },
      components: {
        child: {
          props: ['msg'],
          data: function data () {
            return { name: 'bar' }
          },
          render: function render () {
            var h = this.$createElement;
            return h('div', { class: ['bar'] }, [((this.msg) + " " + (this.name))])
          }
        }
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true" class="foo bar">hello bar</div>');
      done();
    });
  });

  it('has correct lifecycle during render', function (done) {
    var lifecycleCount = 1;
    renderVmWithOptions({
      template: '<div><span>{{ val }}</span><test></test></div>',
      data: {
        val: 'hi'
      },
      beforeCreate: function beforeCreate () {
        expect(lifecycleCount++).toBe(1);
      },
      created: function created () {
        this.val = 'hello';
        expect(this.val).toBe('hello');
        expect(lifecycleCount++).toBe(2);
      },
      components: {
        test: {
          beforeCreate: function beforeCreate () {
            expect(lifecycleCount++).toBe(3);
          },
          created: function created () {
            expect(lifecycleCount++).toBe(4);
          },
          render: function render () {
            expect(lifecycleCount++).toBeGreaterThan(4);
            return this.$createElement('span', { class: ['b'] }, 'testAsync')
          }
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span>hello</span>' +
          '<span class="b">testAsync</span>' +
        '</div>'
      );
      done();
    });
  });

  it('computed properties', function (done) {
    renderVmWithOptions({
      template: '<div>{{ b }}</div>',
      data: {
        a: {
          b: 1
        }
      },
      computed: {
        b: function b () {
          return this.a.b + 1
        }
      },
      created: function created () {
        this.a.b = 2;
        expect(this.b).toBe(3);
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true">3</div>');
      done();
    });
  });

  it('renders asynchronous component', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <test-async></test-async>\n        </div>\n      ",
      components: {
        testAsync: function testAsync (resolve) {
          resolve({
            render: function render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          });
        }
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true"><span class="b">testAsync</span></div>');
      done();
    });
  });

  it('renders asynchronous component (hoc)', function (done) {
    renderVmWithOptions({
      template: '<test-async></test-async>',
      components: {
        testAsync: function testAsync (resolve) {
          resolve({
            render: function render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          });
        }
      }
    }, function (result) {
      expect(result).toContain('<span data-server-rendered="true" class="b">testAsync</span>');
      done();
    });
  });

  it('renders nested asynchronous component', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <test-async></test-async>\n        </div>\n      ",
      components: {
        testAsync: function testAsync (resolve) {
          var options = {
            template: "\n              <span class=\"b\">\n                <test-sub-async></test-sub-async>\n              </span>\n            "
          };

          options.components = {
            testSubAsync: function testSubAsync (resolve) {
              resolve({
                render: function render () {
                  return this.$createElement('div', { class: ['c'] }, 'testSubAsync')
                }
              });
            }
          };
          resolve(options);
        }
      }
    }, function (result) {
      expect(result).toContain('<div data-server-rendered="true"><span class="b"><div class="c">testSubAsync</div></span></div>');
      done();
    });
  });

  it('everything together', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <p class=\"hi\">yoyo</p>\n          <div id=\"ho\" :class=\"{ red: isRed }\"></div>\n          <span>{{ test }}</span>\n          <input :value=\"test\">\n          <img :src=\"imageUrl\">\n          <test></test>\n          <test-async></test-async>\n        </div>\n      ",
      data: {
        test: 'hi',
        isRed: true,
        imageUrl: 'https://vuejs.org/images/logo.png'
      },
      components: {
        test: {
          render: function render () {
            return this.$createElement('div', { class: ['a'] }, 'test')
          }
        },
        testAsync: function testAsync (resolve) {
          resolve({
            render: function render () {
              return this.$createElement('span', { class: ['b'] }, 'testAsync')
            }
          });
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<p class="hi">yoyo</p> ' +
          '<div id="ho" class="red"></div> ' +
          '<span>hi</span> ' +
          '<input value="hi"> ' +
          '<img src="https://vuejs.org/images/logo.png"> ' +
          '<div class="a">test</div> ' +
          '<span class="b">testAsync</span>' +
        '</div>'
      );
      done();
    });
  });

  it('normal attr', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <span :test=\"'ok'\">hello</span>\n          <span :test=\"null\">hello</span>\n          <span :test=\"false\">hello</span>\n          <span :test=\"true\">hello</span>\n          <span :test=\"0\">hello</span>\n        </div>\n      "
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span test="ok">hello</span> ' +
          '<span>hello</span> ' +
          '<span>hello</span> ' +
          '<span test="true">hello</span> ' +
          '<span test="0">hello</span>' +
        '</div>'
      );
      done();
    });
  });

  it('enumerated attr', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <span :draggable=\"true\">hello</span>\n          <span :draggable=\"'ok'\">hello</span>\n          <span :draggable=\"null\">hello</span>\n          <span :draggable=\"false\">hello</span>\n          <span :draggable=\"''\">hello</span>\n          <span :draggable=\"'false'\">hello</span>\n        </div>\n      "
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="false">hello</span> ' +
          '<span draggable="false">hello</span> ' +
          '<span draggable="true">hello</span> ' +
          '<span draggable="false">hello</span>' +
        '</div>'
      );
      done();
    });
  });

  it('boolean attr', function (done) {
    renderVmWithOptions({
      template: "\n        <div>\n          <span :disabled=\"true\">hello</span>\n          <span :disabled=\"'ok'\">hello</span>\n          <span :disabled=\"null\">hello</span>\n          <span :disabled=\"''\">hello</span>\n        </div>\n      "
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true">' +
          '<span disabled="disabled">hello</span> ' +
          '<span disabled="disabled">hello</span> ' +
          '<span>hello</span> ' +
          '<span disabled="disabled">hello</span>' +
        '</div>'
      );
      done();
    });
  });

  it('v-bind object', function (done) {
    renderVmWithOptions({
      data: {
        test: { id: 'a', class: ['a', 'b'], value: 'c' }
      },
      template: '<input v-bind="test">'
    }, function (result) {
      expect(result).toContain('<input id="a" data-server-rendered="true" value="c" class="a b">');
      done();
    });
  });

  it('custom directives', function (done) {
    var renderer = createRenderer({
      directives: {
        'class-prefixer': function (node, dir) {
          if (node.data.class) {
            node.data.class = (dir.value) + "-" + (node.data.class);
          }
          if (node.data.staticClass) {
            node.data.staticClass = (dir.value) + "-" + (node.data.staticClass);
          }
        }
      }
    });
    renderer.renderToString(new Vue({
      render: function render () {
        var h = this.$createElement;
        return h('p', {
          class: 'class1',
          staticClass: 'class2',
          directives: [{
            name: 'class-prefixer',
            value: 'my'
          }]
        }, ['hello world'])
      }
    }), function (err, result) {
      expect(err).toBeNull();
      expect(result).toContain('<p data-server-rendered="true" class="my-class2 my-class1">hello world</p>');
      done();
    });
  });

  it('_scopeId', function (done) {
    renderVmWithOptions({
      _scopeId: '_v-parent',
      template: '<div id="foo"><p><child></child></p></div>',
      components: {
        child: {
          _scopeId: '_v-child',
          render: function render () {
            var h = this.$createElement;
            return h('div', null, [h('span', null, ['foo'])])
          }
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div id="foo" data-server-rendered="true" _v-parent>' +
          '<p _v-parent>' +
            '<div _v-child _v-parent><span _v-child>foo</span></div>' +
          '</p>' +
        '</div>'
      );
      done();
    });
  });

  it('_scopeId on slot content', function (done) {
    renderVmWithOptions({
      _scopeId: '_v-parent',
      template: '<div><child><p>foo</p></child></div>',
      components: {
        child: {
          _scopeId: '_v-child',
          render: function render () {
            var h = this.$createElement;
            return h('div', null, this.$slots.default)
          }
        }
      }
    }, function (result) {
      expect(result).toContain(
        '<div data-server-rendered="true" _v-parent>' +
          '<div _v-child _v-parent><p _v-child _v-parent>foo</p></div>' +
        '</div>'
      );
      done();
    });
  });

  it('comment nodes', function (done) {
    renderVmWithOptions({
      template: '<div><transition><div v-if="false"></div></transition></div>'
    }, function (result) {
      expect(result).toContain("<div data-server-rendered=\"true\"><!----></div>");
      done();
    });
  });

  it('should catch error', function (done) {
    Vue.config.silent = true;
    renderToString(new Vue({
      render: function render () {
        throw new Error('oops')
      }
    }), function (err) {
      expect(err instanceof Error).toBe(true);
      Vue.config.silent = false;
      done();
    });
  });

  it('default value Foreign Function', function () {
    var FunctionConstructor = VM.runInNewContext('Function');
    var func = function () { return 123; };
    var vm = new Vue({
      props: {
        a: {
          type: FunctionConstructor,
          default: func
        }
      },
      propsData: {
        a: undefined
      }
    });
    expect(vm.a).toBe(func);
  });

  it('should prevent xss in attribtues', function () {
    renderVmWithOptions({
      data: {
        xss: '"><script>alert(1)</script>'
      },
      template: "\n        <div>\n          <a :title=\"xss\" :style=\"{ color: xss }\" :class=\"[xss]\">foo</a>\n        </div>\n      "
    }, function (res) {
      expect(res).not.toContain("<script>alert(1)</script>");
    });
  });
});

function renderVmWithOptions (options, cb) {
  renderToString(new Vue(options), function (err, res) {
    expect(err).toBeNull();
    cb(res);
  });
}

var ref$1 = createRenderer();
var renderToStream = ref$1.renderToStream;

describe('SSR: renderToStream', function () {
  it('should render to a stream', function (done) {
    var stream = renderToStream(new Vue({
      template: "\n        <div>\n          <p class=\"hi\">yoyo</p>\n          <div id=\"ho\" :class=\"[testClass, { red: isRed }]\"></div>\n          <span>{{ test }}</span>\n          <input :value=\"test\">\n          <b-comp></b-comp>\n          <c-comp></c-comp>\n        </div>\n      ",
      data: {
        test: 'hi',
        isRed: true,
        testClass: 'a'
      },
      components: {
        bComp: function bComp (resolve) {
          return resolve({
            render: function render (h) {
              return h('test-async-2')
            },
            components: {
              testAsync2: function testAsync2 (resolve) {
                return resolve({
                  created: function created () { this.$parent.$parent.testClass = 'b'; },
                  render: function render (h) {
                    return h('div', { class: [this.$parent.$parent.testClass] }, 'test')
                  }
                })
              }
            }
          })
        },
        cComp: {
          render: function render (h) {
            return h('div', { class: [this.$parent.testClass] }, 'test')
          }
        }
      }
    }));
    var res = '';
    stream.on('data', function (chunk) {
      res += chunk;
    });
    stream.on('end', function () {
      expect(res).toContain(
        '<div data-server-rendered="true">' +
          '<p class="hi">yoyo</p> ' +
          '<div id="ho" class="a red"></div> ' +
          '<span>hi</span> ' +
          '<input value="hi"> ' +
          '<div class="b">test</div> ' +
          '<div class="b">test</div>' +
        '</div>'
      );
      done();
    });
  });

  it('should catch error', function (done) {
    Vue.config.silent = true;
    var stream = renderToStream(new Vue({
      render: function render () {
        throw new Error('oops')
      }
    }));
    stream.on('error', function (err) {
      expect(err.toString()).toMatch(/oops/);
      Vue.config.silent = false;
      done();
    });
    stream.on('data', function (_) { return _; });
  });

  it('should not mingle two components', function (done) {
    var padding = (new Array(20000)).join('x');
    var component1 = new Vue({
      template: ("<div>" + padding + "<div></div></div>"),
      _scopeId: '_component1'
    });
    var component2 = new Vue({
      template: "<div></div>",
      _scopeId: '_component2'
    });
    var stream1 = renderToStream(component1);
    var stream2 = renderToStream(component2);
    var res = '';
    stream1.on('data', function (text) {
      res += text.toString('utf-8').replace(/x/g, '');
    });
    stream1.on('end', function () {
      expect(res).not.toContain('_component2');
      done();
    });
    stream1.read(1);
    stream2.read(1);
  });
});
