/**
 * Panels Plickle Grammar
 * =======================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */
module.exports = {
  comments: '#',
  header: 'Panels',
  blocks: [
    {
      name: 'Panel',
      children: ['Step', 'Before']
    },
    'Before'
  ]
};
