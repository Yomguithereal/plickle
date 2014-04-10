/**
 * Plickle Basic Testing
 * ======================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */

var fs = require('fs'),
    assert = require('assert'),
    PanelInterpreter = require('./lang/panels/interpreter');

/**
 * Finding users panels
 */
describe('the given users', function() {
  it('should belong to the correct panels', function() {

    // Loading the definition file
    var basic = fs.readFileSync('./test/resources/basic.panels', 'utf-8'),
        i = new PanelInterpreter(basic);

    // Assertions
    assert.equal('Old Females', i.userPanel({sex: 'woman', age: 56}));
    assert.equal('Young Females', i.userPanel({sex: 'woman', age: 12}));
    assert.equal('Young Males', i.userPanel({sex: 'man', age: 34}));
    assert.equal('Old Males', i.userPanel({sex: 'man', age: 100}));
  });
});
