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

  this.needSubsteps = helpers.some(this.grammar.blocks, function(b) {
    return b.children !== undefined;
  });

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
        blockLvl = false,
        subBlockLvl = false,
        blockMatches = null,
        currentBlock = null,
        currentSubBlock = null;

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

            // Trying to assert a new block
            var blockType = blockMatches[1].toLowerCase(),
                blockName = blockMatches[2].trim();

            // Block level?
            blockLvl = this.checkBlock(blockType);

            // SubBlock level?
            if (this.needSubsteps && currentBlock !== null) {
              var type = currentBlock.type,
                  gblock = helpers.first(this.grammar.blocks, function(b) {
                    return b === type || b.name === type;
                  });
              subBlockLvl = this.checkBlock(blockType, gblock.children);
            }

            // Pushing relevant blocks or triggering and error
            if (blockLvl) {
              blocks.push(this.parseBlock(blockType, blockName, true));
              currentBlock = blocks[blocks.length -1];
            }
            else if (subBlockLvl) {
              currentBlock.substeps.push(
                this.parseBlock(blockType, blockName)
              );
              currentSubBlock =
                currentBlock.substeps[currentBlock.substeps - 1];
            }
            else {
              errorMsg('invalid block "' + blockMatches[1] + '"');
            }
          }
          else {

            // Registering a step to the current block
            (blockLvl ? currentBlock : currentSubBlock).steps.push(
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

  this.che

  this.checkBlock = function(blockType, children) {
    var test = function(b) {
      return b === blockType || b.name === blockType;
    };

    return helpers.some(children || this.grammar.blocks, test);
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
