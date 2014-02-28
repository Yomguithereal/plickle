/**
 * Tsukemono Wrapper
 * ==================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 */

// TODO: order the blocks in a precise order?
// TODO: possibility to define rules for each of the blocks separately
var helpers = require('./helpers'),
    Parser = require('./parser');

function Wrapper(grammar) {
  var _this = this;

  // Create the parser
  this._parser = new Parser(grammar);

  // State
  this._definitions = [];
  this._condition = true;
  this._vars = {};

  // Methods
  this.parse = function(string) {
    return this._parser.parse(string);
  };

  this.set = function(key, value) {
    this._vars[key] = value;
    return this;
  };

  this.get = function(key) {
    return (key === undefined) ? this._vars : this._vars[key];
  };

  this.buildDefinition = function(regex, callback, type) {
    var func = function(matches, context) {
      return callback.apply(_this, matches.slice(1).concat(context));
    };

    this._definitions.push({
      type: type,
      func: func,
      regex: regex
    });
  };

  this.def = function(regex, callback) {
    this.buildDefinition(regex, callback, 'normal');
  };

  this._templates = [
    'If',
    'And',
    'Or',
    'Then',
    'Else'
  ];

  this._templates.map(function(t) {
    _this['def' + t] = function(regex, callback) {
      _this.buildDefinition(regex, callback, t.toLowerCase());
    };
  });

  this.execute = function(string, config) {
    var data = this.parse(string),
        config = config || {},
        stop = false,
        matched,
        matches,
        result,
        block,
        step,
        def;

    var i, j, k, l, m, n;

    // Sorting and or filtering
    if (config.filterFunc !== undefined)
      data = data.filter(config.filterFunc);

    if (config.sortFunc !== undefined)
      data = data.sort(config.sortFunc);

    // On execution
    if (this.onExecutionStart !== undefined)
      this.onExecutionStart(data);

    // Iterating through blocks
    for (i = 0, l = data.blocks.length; i < l; i++) {
      block = data.blocks[i];

      // Restoring condition
      this._condition = true;

      // Triggering block beginning callback if any
      if (this.onBlockStart !== undefined)
        stop = !this.onBlockStart(block);

      // Iterating through steps
      if (!stop) {
        for (j = 0, m = block.steps.length; j < m; j++) {
          step = block.steps[j];

          for (k = 0, n = this._definitions.length; k < n; k++) {
            def = this._definitions[k];

            matched = false;
            matches = step.match(def.regex);

            if (matches) {
              matched = true;

              // Should we run the function
              if (!((def.type === 'and' && !this._condition) ||
                    (def.type === 'or' && this._condition) ||
                    (def.type === 'then' && !this._condition) ||
                    (def.type === 'else' && this._condition))) {

                result = def.func(
                  matches, 
                  {
                    block: block,
                    stepIndex: i
                  }
                );
                
                if (def.type === 'if')
                  this._condition = result;
                else if (def.type === 'and')
                  this._condition = this._condition && result;
                else if (def.type === 'or')
                  this._condition = this._condition || result;
              }

              break;
            }
          }

          // Throw error on unmatched string
          if (!matched && this.onUnmatchedStep !== undefined)
            this.onUnmatchedStep(step);
        }
      }

      // Triggering block ending callback if any
      if (this.onBlockEnd !== undefined)
        this.onBlockEnd(block);
    }
  };
}

module.exports = Wrapper;
