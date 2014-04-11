/**
 * Plickle Parser
 * ===============
 *
 * Author: PLIQUE Guillaume (Yomguithereal)
 * Organization: Médialab SciencesPo
 */
var helpers = require('./helpers');

function Parser(grammar) {
  var _this = this;

  // Helpers
  function errorMsg(msg) {
    throw new Error('plickle.parser: ' + msg +
                    (_this.lineno ? '\nlineno: ' + _this.lineno : ''));
  }

  function cleanBlocks(blocks) {
    return blocks.map(function(b) {
      if (typeof b === 'object') {
        if (!b.children)
          return b.name.toLowerCase();
        else
          return {
            name: b.name.toLowerCase(),
            children: cleanBlocks(b.children)
          };
      }
      else {
        return b.toLowerCase();
      }
    });
  }

  // Grammar
  this.grammar = {
    blocks: (cleanBlocks(grammar.blocks) || ['block']),
    comments: grammar.comments || '#',
    header: (grammar.header || 'type').toLowerCase(),
    separator: grammar.separator || ':'
  };

  this.regexes = {
    header: new RegExp(
      '([^' + this.grammar.separator + ']*)' + this.grammar.separator + '(.*)',
      'i'
    )
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

    // Resetting lineno
    this.lineno = null;

    // State
    var header = false,
        inBlocks = false,
        inSubBlocks = false,
        blockLvl = false,
        subBlockLvl = false,
        blockMatches = null,
        currentBlockIndex = null,
        currentSubBlockIndex = null;

    // Placeholders
    var blocks = [],
        description = '',
        name = '';

    // Iterating through lines
    string.split('\n').map(function(line, i) {

      // Updating line number
      this.lineno = i + 1;

      // Cleaning the line
      line = this.cleanLine(line);
      
      // Next if invalid line
      if (this.shouldNotParse(line))
        return;

      // Parsing header
      if (!header) {
        name = this.parseHeader(line);
        header = true;
      }
      else {

        // Do we have a block header?
        blockMatches = line.match(this.regexes.header);
        blockLine = !!blockMatches;

        // Are we in blocks?
        inBlocks = inBlocks || blockLine;

        // Parsing description
        if (!inBlocks) {
          description += ' ' + this.parseDescription(line);
        }

        // Parsing blocks
        else {

          if (blockLine) {
            var blockType = blockMatches[1].toLowerCase(),
                blockName = blockMatches[2].trim();

            // Block or SubBlock?
            blockLvl = this.checkBlock(blockType);

            // TODO: refactor
            if (currentBlockIndex !== null) {
              var type = blocks[currentBlockIndex].type,
                  grammarBlock = helpers.first(this.grammar.blocks, function(b) {
                    return b === type || b.name === type;
                  });
              subBlockLvl = this.checkSubBlock(blockType, grammarBlock.children);
            }

            if (!blockLvl && !subBlockLvl) {
              errorMsg('invalid block "' + blockMatches[1] + '"');
            }
            else if (blockLvl) {
              blocks.push(this.parseBlock(blockType, blockName, true));
              currentBlockIndex = blocks.length - 1;
            }
            else {
              blocks[currentBlockIndex].substeps.push(
                this.parseBlock(blockType, blockName)
              );
              currentSubBlockIndex = blocks[currentBlockIndex].substeps.length - 1;
            }
          }
          else {
            if (blockLvl)
              blocks[currentBlockIndex].steps.push(this.parseStep(line));
            else if (subBlockLvl)
              blocks[currentBlockIndex].substeps[currentSubBlockIndex].steps.push(
                this.parseStep(line)
              );
          }
        }
      }
    }, this);

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
      errorMsg('incorrect header "' +
               matches[1]  + '" instead of "' +
               helpers.capitalize(this.grammar.header) + '".');

    return matches[2].trim();
  };

  this.parseDescription = function(line) {
    return line.trim();
  };

  this.checkBlock = function(blockType) {
    var test = function(b) {
      return b === blockType || b.name === blockType;
    };

    return helpers.some(this.grammar.blocks, test);
  };

  this.checkSubBlock = function(blockType, children) {
    var test = function(b) {
      return b === blockType || b.name === blockType;
    };

    return helpers.some(children, test);
  };

  this.parseBlock = function(blockType, blockName, sub) {
    var block = {
      type: blockType,
      name: blockName,
      steps: []
    };

    if (sub)
      block.substeps = [];
    
    return block;
  };

  this.parseStep = function(line) {
    return line.trim();
  };
}

module.exports = Parser;
