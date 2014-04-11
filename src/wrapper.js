/**
 * Plickle Wrapper
 * ================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */

// TODO: possibility to define rules for each of the blocks separately?
// TODO: sublevels?

var helpers = require('./helpers'),
    Parser = require('./parser');

function Wrapper(grammar) {
  var _this = this;

  // Create the parser
  this._parser = new Parser(grammar);

  // State
  this._condition = true;
  this._definitions = [];
  this._events = {};
  this._vars = {};

  // Private Utilities
  //-------------------

  // Call event if it exists
  this._dispatch = function(name) {
    var e = this._events[name];

    if (e !== undefined)
      return e.call(this, Array.prototype.slice.call(arguments, 1));
  }

  // Should we run the function
  this._pass = function(type) {
    return !((type === 'and' && !this._condition)  ||
             (type === 'or' && this._condition)    ||
             (type === 'then' && !this._condition) ||
             (type === 'else' && this._condition));
  };

  // Applying condition
  this._applyCondition = function(type, result) {
    if (type === 'if')
      this._condition = result;
    else if (type === 'and')
      this._condition = this._condition && result;
    else if (type === 'or')
      this._condition = this._condition || result;
  };

  // Public API
  //------------

  // Bind an event
  this.bind = function(name, fn) {

    if (typeof fn !== 'function')
      throw new TypeError(
        'plickle.wrapper.bind: trying to bind a no-function to event ' + name
      ); 
    this._events[name] = fn;
  }

  // Parser abstract
  this.parse = function(string) {
    return this._parser.parse(string);
  };

  // Set an internal variable
  this.set = function(key, value) {
    this._vars[key] = value;
    return this;
  };

  // Get an internal variable
  this.get = function(key) {
    return (key === undefined) ? this._vars : this._vars[key];
  };

  // Build an execution definition
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

  // Possible types of definition
  this._templates = [
    'normal',
    'if',
    'and',
    'or',
    'then',
    'else'
  ];

  // Dynamically creating the definition methods from templates
  this._templates.map(function(t) {
    _this['def' + (t === 'normal' ? '' : helpers.capitalize(t))] =
      function(regex, callback) {
        _this.buildDefinition(regex, callback, t);
      };
  });

  // Loading definitions in batch
  this.defs = function(array) {
    if (toString.call(array) !== '[object Array]')
      throw new TypeError(
        'plickle.wrapper.defs: first argument should be an array.'
      );

    array.map(function(def) {
      var type = (!def.type || def.type === 'normal') ? '' : def.type;

      // Is this type authorized?
      if (!~_this._templates.indexOf(type || 'normal'))
        throw 'plickle.wrapper.defs: wrong definition type (' + type + ')';

      // Registering the definition
      _this['def' + helpers.capitalize(type)](def.pattern, def.method);
    });
  };

  // Main execution function
  this.execute = function(string, config) {
    var data = this.parse(string),
        config = config || {},
        stop = false,
        matched,
        matches,
        result,
        block,
        step,
        substep,
        def;

    var i, j, k, l, m, n, o, p;

    // Sorting
    if (config.filter !== undefined)
      data.blocks = data.blocks.filter(config.filter);

    // Filtering
    if (config.sort !== undefined)
      data.blocks = data.blocks.sort(config.sort);

    // On execution
    this._dispatch('execution.before', data);

    // Iterating through blocks
    for (i = 0, l = data.blocks.length; i < l; i++) {
      block = data.blocks[i];

      // Restoring condition
      this._condition = true;

      // Triggering block beginning callback if any
      stop = (this._dispatch('block.before', block) === false);

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
              if (this._pass(def.type)) {

                result = def.func(
                  matches, 
                  {
                    block: block,
                    blockIndex: i,
                    stepIndex: j,
                    step: step
                  }
                );
                
                // In logical cases, applying the new condition
                this._applyCondition(def.type, result);
              }

              break;
            }
          }

          // Throw error on unmatched string
          if (!matched)
            this._dispatch('step.unmatched', step);
        }
      }

      // Triggering block ending callback if any
      this._dispatch('block.after', block);
    }
  };
}

module.exports = Wrapper;
