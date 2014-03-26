var fs = require('fs');
var PanelInterpreter = require('./lang/panels/panels.interpreter');
var basic = fs.readFileSync('./tests/resources/basic.panels', 'utf-8');
var p = new PanelInterpreter(basic);

var u1 = p.userPanel({sex: 'woman', age: 56});
var u2 = p.userPanel({sex: 'woman', age: 12});
var u3 = p.userPanel({sex: 'man', age: 34});
var u4 = p.userPanel({sex: 'man', age: 100});

console.log([u1, u2, u3, u4].join('\n'));