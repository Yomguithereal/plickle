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
  for (var i = 0, l = array.length; i < l; i++) {
    if (array[i] === element)
      return true;
  }
  return false;
}
