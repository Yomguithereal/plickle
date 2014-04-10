/**
 * Plickle Public Interface
 * ===========================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 */
var parser = require('./src/parser'),
    wrapper = require('./src/wrapper');

// Exporting
exports.parser = parser;
exports.wrapper = wrapper;

// API Shortcuts
exports.parse = function(grammar, text) {
  return new parser(grammar).parse(text);
}
