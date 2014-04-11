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

module.exports = {
  capitalize: capitalize,
  first: first,
  some: some
};
