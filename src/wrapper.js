/**
 * Plickle Wrapper
 * ================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */

// TODO: sublevels?

var helpers = require('./helpers'),
    Parser = require('./parser');

function Wrapper(grammar) {
  var _this = this;

  // Create the parser
  this._parser = new Parser(grammar);

  // State
  this._condition = true;
  this._definitions = {};
  this._events = {};
  this._vars = {};

  // Private Utilities
  //-------------------

  // Build an execution definition
  this._buildDefinition = function(type, regex, block, callback) {
    if (typeof block === 'function') {
      callback = block;
      block = '*';
    }

    var fn = function(matches, context) {
      return callback.apply(_this, matches.slice(1).concat(context));
    };

    if (this._definitions[block] === undefined)
      this._definitions[block] = [];

    this._definitions[block].push({
      type: type,
      fn: fn,
      regex: regex
    });
  };

  // Call event if it exists
  this._dispatch = function(name) {
    var e = this._events[name];

    if (e !== undefined)
      return e.apply(this, Array.prototype.slice.call(arguments, 1));
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

  function formatContext(block, step, type) {
    return (type === 'block') ?
      {block: block, step: step} :
      {subBlock: block, subStep: step};
  } 

  // Iteration on blocks and subBlocks
  this._iterate = function(blocks, type, context) {
    var defs,
        stop,
        block,
        matched,
        matches,
        result;

    var i, j, k, l, m, n;

    // Through blocks
    for (i = 0, l = blocks.length; i < l; i++) {
      block = blocks[i];
      defs = this._definitions['*'].concat(this._definitions[block.type] || []);

      // Restoring condition
      this._condition = true;

      // Stopping if callback before return false
      stop = (this._dispatch(type + '.before', block) === false);

      if (stop)
        return;

      // Through steps
      for (j = 0, m = block.steps.length; j < m; j++) {
        step = block.steps[j];

        // Through definitions
        for (k = 0, n = defs.length; k < n; k++) {
          def = defs[k];

          matched = false;
          matches = step.match(def.regex);

          if (matches) {
            matched = true;

            // Should we run the function?
            if (this._pass(def.type)) {
              result = def.fn(
                matches,
                helpers.extend(context, formatContext(block, step, type))
              );

              // In logical cases, we apply the new condition
              this._applyCondition(def.type, result);
            }

            break;
          }
        }

        // Iterating through subBlocks
        if (block.subBlocks !== undefined)
          this._iterate(block.subBlocks, 'subBlock');

        // Unmatched
        if (type === 'block')
          this._dispatch('step.unmatched', step);
      }
    }

    // Block end
    this._dispatch(type + '.after', block);
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
      function(regex, block, callback) {
        _this._buildDefinition(t, regex, block, callback);
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
      _this['def' + helpers.capitalize(type)](
        def.pattern,
        def.block || '*',
        def.method
      );
    });
  };

  // Main execution function
  this.execute = function(string, config) {
    var data = this.parse(string),
        config = config || {};

    // Sorting
    if (config.filter !== undefined)
      data.blocks = data.blocks.filter(config.filter);

    // Filtering
    if (config.sort !== undefined)
      data.blocks = data.blocks.sort(config.sort);

    // On execution
    this._dispatch('execution.before', data);

    // Iterating through blocks
    this._iterate(data.blocks, 'block');
  };
}

module.exports = Wrapper;
