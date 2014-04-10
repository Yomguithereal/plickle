/**
 * Plickle Parser
 * =================
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */

// TODO: function to format error msgs plus line in file?
var helpers = require('./helpers');

function Parser(grammar) {
  var _this = this;

  // Grammar
  // TODO: enforce better
  var _lowercase = function(s) {
    return s.toLowerCase();
  }

  this.grammar = {
    comments: grammar.comments || '#',
    header: (grammar.header || 'type').toLowerCase(),
    blocks: (grammar.blocks || ['block']).map(_lowercase)
  }

  this.regexes = {
    header: /([^:]*):(.*)/i
  };

  // Utilities
  //-----------
  this.cleanLine = function(line) {
    return line.trim().replace('\t', '');
  };

  this.shouldNotParse = function(line) {
    return !line || line.charAt(0) === this.grammar.comments;
  };

  // Parsing functions
  //-------------------
  this.parse = function(string) {

    // State
    var top = inBlocks = blockLine = false;

    // Holders
    var description = '',
        header = false,
        blocks = [],
        currentBlockIndex,
        name;

    // Iterating through lines
    string.split('\n').map(function(line) {
      line = _this.cleanLine(line);
      
      // Next if commentary
      if (_this.shouldNotParse(line))
        return false;

      // Parsing header
      if (!header) {
        name = _this.parseHeader(line);
        header = true;
      }
      else {
        blockLine = _this.regexes.header.test(line);

        // Are we in blocks?
        inBlocks = inBlocks || blockLine;

        // Parsing description
        if (!inBlocks) {
          description += ' ' + _this.parseDescription(line);
        }

        // Parsing blocks
        else {

          if (blockLine) {

            // Getting new block
            blocks.push(_this.parseBlock(line));
            currentBlockIndex = blocks.length - 1;
          }
          else {

            // Getting new step
            blocks[currentBlockIndex].steps.push(
              _this.parseStep(line)
            );
          }
        }
      }
    });
    return {
      name: name,
      header: this.grammar.header,
      description: description.trim(),
      blocks: blocks
    }
  };

  this.parseHeader = function(line) {
    var matches = line.match(this.regexes.header);

    if (!~line.toLowerCase().indexOf(this.grammar.header))
      throw (
        'plickle.parser: Error - incorrect header (' + 
        matches[1]  + ' instead of ' +
        helpers.capitalize(this.grammar.header) + ').'
      );

    return matches[2].trim();
  };

  this.parseDescription = function(line) {
    return line.trim();
  };

  this.parseBlock = function(line) {
    var matches = line.match(this.regexes.header) || [],
        blockType = matches[1],
        blockName = matches[2];

    // If the block type is not registered
    if (!helpers.some(this.grammar.blocks, blockType.toLowerCase()))
      throw (
        'plickle.parser: Error - unregistered block type (' + 
        matches[1] + ').'
      );

    return {
      type: blockType,
      name: blockName.trim(),
      steps: []
    };
  };

  this.parseStep = function(line) {
    return line.trim();
  };
}

module.exports = Parser;
