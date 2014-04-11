/**
 * Plickle Helpers
 * ================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function first(array, fn) {
  var l = array.length,
      i;

  for (i = 0; i < l; i++) {
    if (fn(array[i]))
      return array[i];
  }

  return false;
}

function some(array, fn) {
  return !!first(array, fn);
}

function extend() {
  var i,
      k,
      res = {},
      l = arguments.length;

  for (i = l - 1; i >= 0; i--)
    for (k in arguments[i])
      res[k] = arguments[i][k];

  return res;
};

module.exports = {
  capitalize: capitalize,
  extend: extend,
  first: first,
  some: some
};
