/**
 * Tsukemono Helpers
 * ==================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 */

exports.capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

exports.some = function(array, element) {
  var l = array.length,
      i;

  for (i = 0; i < l; i++) {
    if (array[i] === element)
      return true;
  }

  return false;
}
