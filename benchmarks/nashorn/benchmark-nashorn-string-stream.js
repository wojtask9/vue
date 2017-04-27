'use strict';

// this is Hack because I don't want modify ssr*-spec.js files

var Vue = global.Vue;
var createRenderer = global.createRenderer;

var self$1 = (global || root);

self$1.performance = {
  now: function () {
    var hrtime = process.hrtime();
    return ((hrtime[0] * 1000000 + hrtime[1] / 1000) / 1000)
  }
};

function generateGrid (rowCount, columnCount) {
  var grid = [];

  for (var r = 0; r < rowCount; r++) {
    var row = { id: r, items: [] };
    for (var c = 0; c < columnCount; c++) {
      row.items.push({ id: (r + '-' + c) });
    }
    grid.push(row);
  }

  return grid
}

var gridData = generateGrid(1000, 10);

var gridComponent = {
  template: '<div><h1>{{ Math.random() }}</h1><my-table></my-table></div>',
  components: {
    myTable: {
      data: function () {
        return {
          grid: gridData
        }
      },
      // template: '<table><tr v-for="row in grid"><th>123</th><td v-for="item in row.items">{{ item.id }}</td></tr></table>',
      template: '<table width="100%" cellspacing="2"><row v-for="row in grid" :row="row"></row></table>',
      components: {
        row: {
          props: ['row'],
          template: '<tr><th>{{ Math.random() }}</th><column v-for="item in row.items"></column></tr>',
          components: {
            column: {
              template: '<td class="item">' +
                // 25 plain elements for each cell
                '<ul class="yoyo">' +
                  '<li class="hihi" v-for="i in 5">' +
                    '<span v-for="i in 5">fsefs</span>' +
                    '</li>' +
                '</ul>' +
              '</td>'
            }
          }
        }
      }
    }
  }
};

process.env.NODE_ENV = 'production';

var renderToString = createRenderer().renderToString;

console.log('--- renderToString --- ');
var self = (global || root);
var loop = function ( i ) {
  self.s = self.performance.now();

  renderToString(new Vue(gridComponent), function () {
    console.log('#' + i + ' Complete time: ' + (self.performance.now() - self.s).toFixed(2) + 'ms');
    console.log();
  });
};

for (var i = 0; i < 10; i++) loop( i );

/* eslint-disable no-unused-vars */

process.env.NODE_ENV = 'production';

var renderToStream = createRenderer().renderToStream;

console.log('--- renderToStream --- ');
var self$2 = (global || root);
var s = self$2.performance.now();

var stream = renderToStream(new Vue(gridComponent));
var str = '';
var first;
var complete;
stream.once('data', function () {
  first = self$2.performance.now() - s;
});
stream.on('data', function (chunk) {
  str += chunk;
});
stream.on('end', function () {
  complete = self$2.performance.now() - s;
  console.log(("first chunk: " + (first.toFixed(2)) + "ms"));
  console.log(("complete: " + (complete.toFixed(2)) + "ms"));
  console.log();
});
