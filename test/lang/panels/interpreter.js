/**
 * Panels Language Definition
 * ===========================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 */

var plickle = require('../../../index'),
    grammar = require('./grammar');

function PanelsInterpreter(string) {
  plickle.wrapper.call(this, grammar);
  var _this = this;

  // Properties
  this.string = string
  this.user = null;
  this.panel = null;

  // Methods
  this.userPanel = function(user) {
    this.panel = null;
    this.user = user;
    this.execute(this.string);
    return this.panel;
  }

  // Callbacks
  this.bind('block.start', function(b) {

    // Breaking if panel has been found
    return !this.panel;
  })

  // Definitions
  this.defIf(
    /^If the user's (\w+) is (superior|inferior) to (\d+)/i,
    function(criteria, operator, value) {
      if (operator === 'superior')
        return this.user[criteria] > +value;
      else
        return this.user[criteria] < +value;
    }
  );

  this.defIf(/^If the user is a (\w+)/i, function(sex) {
    return this.user.sex === sex;
  });

  this.defAnd(/^And (?:if )?the user is a (\w+)/i, function(sex) {
    return this.user.sex === sex;
  });

  this.defThen(/^Then (?:he|she) belongs? to this panel/i, function(c) {
    this.panel = c.block.name;
  });
}

module.exports = PanelsInterpreter;
