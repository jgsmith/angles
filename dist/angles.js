// Generated by CoffeeScript 1.4.0

/*
Angles 0.130730

Copyright (c) 2010, Ajax.org B.V. 
Copyright (c) 2012, 2013 University of Maryland. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, 
  this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright 
  notice, this list of conditions and the following disclaimer in the 
  documentation and/or other materials provided with the distribution.
* Neither the name of University of Maryland nor the names of its 
  contributors may be used to endorse or promote products derived from 
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL UNIVERSITY OF MARYLAND BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function() {
  var Angles, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Angles = (_ref = this.Angles) != null ? _ref : this.Angles = {};

  (function(Angles, _, Backbone, ace) {
    var SAXParser;
    Angles.XMLDocument = (function(_super) {

      __extends(XMLDocument, _super);

      function XMLDocument() {
        return XMLDocument.__super__.constructor.apply(this, arguments);
      }

      XMLDocument.prototype.defaults = {
        "name": "untitled",
        "content": ""
      };

      XMLDocument.prototype.validate = function(attrs) {
        if (!(attrs.name != null)) {
          return "document must have a name";
        }
        if (attrs.name = ~/^\s*$/) {
          return "document must have a name";
        }
      };

      return XMLDocument;

    })(Backbone.Model);
    Angles.XMLDocumentList = (function(_super) {

      __extends(XMLDocumentList, _super);

      function XMLDocumentList() {
        return XMLDocumentList.__super__.constructor.apply(this, arguments);
      }

      XMLDocumentList.prototype.model = Angles.XMLDocument;

      return XMLDocumentList;

    })(Backbone.Collection);
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{-(.+?)\}\}/g
    };
    Angles.FileSelector = (function(_super) {

      __extends(FileSelector, _super);

      function FileSelector() {
        return FileSelector.__super__.constructor.apply(this, arguments);
      }

      FileSelector.prototype.initialize = function() {
        return this.template = _.template($('#file-list-template').html());
      };

      FileSelector.prototype.render = function() {
        this.$el.html(this.template({}));
        this.collection.each(this.addOne, this);
        return this;
      };

      FileSelector.prototype.addOne = function(model) {
        var view;
        view = new Angles.FileSelectorRow({
          model: model
        });
        return this.$("form").append(view.render().$el);
      };

      return FileSelector;

    })(Backbone.View);
    Angles.FileSelectorRow = (function(_super) {

      __extends(FileSelectorRow, _super);

      function FileSelectorRow() {
        return FileSelectorRow.__super__.constructor.apply(this, arguments);
      }

      FileSelectorRow.prototype.initialize = function() {
        this.template = _.template($('#file-item-template').html());
        this.listenTo(this.model, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      FileSelectorRow.prototype.render = function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
      };

      return FileSelectorRow;

    })(Backbone.View);
    Angles.ACEEditorView = (function(_super) {

      __extends(ACEEditorView, _super);

      function ACEEditorView() {
        return ACEEditorView.__super__.constructor.apply(this, arguments);
      }

      ACEEditorView.prototype.tagName = "div";

      ACEEditorView.prototype.className = "ace-editor";

      ACEEditorView.prototype.initialize = function() {
        var annotations, dispatcher,
          _this = this;
        annotations = [];
        dispatcher = this.options.dispatcher;
        if (dispatcher == null) {
          dispatcher = _.clone(Backbone.Events);
        }
        this.dispatcher = dispatcher;
        dispatcher.on("editor:reload", function() {
          _this.clearAnnotations();
          return _this.setContent();
        });
        dispatcher.on("document:save", function() {
          return _this.saveModel();
        });
        dispatcher.on("validation:start", function() {
          return annotations = [];
        });
        dispatcher.on("validation:error", function(e) {
          return annotations.push(e);
        });
        dispatcher.on("validation:end", function() {
          var select;
          select = _this.$editor.getSelection();
          _this.clearAnnotations();
          _this.$editor.focus();
          if (annotations.length > 0) {
            _this.$editor.gotoLine(annotations[0].row + 1, annotations[0].column, true);
            select.selectWordLeft();
            select.selectWordLeft();
          }
          return _this.$editor.session.setAnnotations(annotations);
        });
        return dispatcher.on("document:switch", function(e) {
          return _this.setModel(e);
        });
      };

      ACEEditorView.prototype.render = function() {
        var _this = this;
        this.$editor = ace.edit(this.el);
        this.$editor.getSession().on('change', function(e) {
          return _this.dispatcher.trigger('editor:change', e);
        });
        this.$editor.getSession().setMode("ace/mode/xml");
        return this;
      };

      ACEEditorView.prototype.setContent = function() {
        return this.$editor.setValue(this.model.get('content'));
      };

      ACEEditorView.prototype.getContent = function() {
        return this.$editor.getValue();
      };

      ACEEditorView.prototype.getDocument = function() {
        var _this = this;
        return {
          getValue: function() {
            return _this.$editor.getValue();
          },
          getLength: function() {
            return _this.$editor.session.getDocument().getLength();
          },
          getLine: function(n) {
            return _this.$editor.session.getDocument().getLine(n);
          }
        };
      };

      ACEEditorView.prototype.saveModel = function() {
        var _this = this;
        this.model.set('content', this.getContent());
        return this.model.save({
          success: function() {
            _this.model = m;
            return _this.dispatcher.trigger("editor:reload");
          },
          error: function() {
            return _this.dispatcher.trigger("editor:error", "Unable to change document");
          }
        });
      };

      ACEEditorView.prototype.setModel = function(m) {
        this.model = m;
        return this.dispatcher.trigger("editor:reload");
      };

      ACEEditorView.prototype.clearAnnotations = function() {
        return this.$editor.session.clearAnnotations();
      };

      ACEEditorView.prototype.setMode = function(m) {
        return this.$editor.getSession().setMode(m);
      };

      return ACEEditorView;

    })(Backbone.View);
    Angles.Validator = (function() {

      function Validator(options) {
        var _base, _base1, _base2, _base3, _ref1, _ref2, _ref3, _ref4, _ref5,
          _this = this;
        this.options = options;
        this.dispatcher = this.options.dispatcher;
        this.$schema = {};
        this.$errors = [];
        this.$events = this.options.events;
        if ((_ref1 = this.$events) == null) {
          this.$events = {};
        }
        if ((_ref2 = (_base = this.$events).start) == null) {
          _base.start = "validation:start";
        }
        if ((_ref3 = (_base1 = this.$events).end) == null) {
          _base1.end = "validation:end";
        }
        if ((_ref4 = (_base2 = this.$events).error) == null) {
          _base2.error = "validation:error";
        }
        if ((_ref5 = (_base3 = this.$events).trigger) == null) {
          _base3.trigger = "validation";
        }
        this.$angles = this.options.anglesView;
        this.dispatcher.on(this.$events.trigger, function() {
          _this.dispatcher.trigger(_this.$events.start);
          return _this.startValidation();
        });
      }

      Validator.prototype.displayErrors = function() {
        var _this = this;
        $(this.errors()).each(function(idx, e) {
          return _this.dispatcher.trigger(_this.$events.error, e);
        });
        return this.endValidation();
      };

      Validator.prototype.startValidation = function() {
        return console.log("You need to redefine startValidation for your class.");
      };

      Validator.prototype.endValidation = function() {
        return this.dispatcher.trigger(this.$events.end);
      };

      Validator.prototype.setSchema = function(s) {
        this.$schema = s;
        return this.dispatcher.trigger(this.$events.trigger);
      };

      Validator.prototype.errors = function() {
        return this.$errors;
      };

      return Validator;

    })();
    Angles.Validator.SRV = (function(_super) {

      __extends(SRV, _super);

      function SRV(options) {
        this.$validatorUrl = this.options.validator;
      }

      SRV.prototype.startValidation = function() {
        var doc, xmlDocument,
          _this = this;
        doc = this.$angles.getDocument();
        xmlDocument = escape(doc.getValue());
        return $.ajax({
          url: this.$validatorUrl,
          type: "POST",
          crossDomain: true,
          processData: false,
          data: "schema=" + this.$schema + "&document=" + xmlDocument,
          dataType: "jsonp",
          success: function(data) {
            return _this.processValidationResults(data);
          },
          error: function(data) {
            return console.log("Server cannot be reached");
          }
        });
      };

      SRV.prototype.processValidationResults = function(data) {
        var datum, _i, _len;
        this.$errors = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          datum = data[_i];
          this.$errors.push({
            text: datum.message,
            row: datum.line - 1,
            column: datum.column,
            type: datum.type
          });
        }
        return this.displayErrors();
      };

      return SRV;

    })(Angles.Validator);
    SAXParser = (function() {

      function SAXParser(callbacks) {
        this.callbacks = callbacks;
      }

      SAXParser.prototype.reset = function() {
        var parser,
          _this = this;
        parser = sax.parser(true, {
          xmlns: true,
          noscript: true,
          position: true
        });
        if (this.callbacks.error != null) {
          parser.onerror = function(e) {
            _this.callbacks.error(e);
            return parser.resume();
          };
        } else {
          parser.onerror = function(e) {
            _this.validationError((e.message.split(/\n/))[0] + ".");
            return parser.resume();
          };
        }
        if (this.callbacks.characters != null) {
          parser.ontext = function(t) {
            return _this.callbacks.characters(t);
          };
        }
        if (this.callbacks.startElement != null) {
          parser.onopentag = function(node) {
            return _this.callbacks.startElement(node);
          };
        }
        if (this.callbacks.endElement != null) {
          parser.onclosetag = function(name) {
            return _this.callbacks.endElement(name);
          };
        }
        if (this.callbacks.comment) {
          parser.oncomment = function(comment) {
            return _this.callbacks.comment(comment);
          };
        }
        if (this.callbacks.startCdata != null) {
          parser.onopencdata = function() {};
        }
        if (this.callbacks.cdata != null) {
          parser.oncdata = function(cdata) {};
        }
        if (this.callbacks.endCdata != null) {
          parser.onclosecdata = function() {};
        }
        if (this.callbacks.endDocument != null) {
          parser.onend = function() {
            return _this.callbacks.endDocument();
          };
        }
        if (this.callbacks.startDocument != null) {
          parser.onstart = function() {
            return _this.callbacks.startDocument();
          };
        } else {
          parser.onstart = function() {};
        }
        this.$parser = parser;
        return this.$errors = [];
      };

      SAXParser.prototype.parse = function(doc) {
        var i, n, parser, _i;
        this.reset();
        parser = this.$parser;
        n = doc.getLength();
        parser.onstart();
        for (i = _i = 0; 0 <= n ? _i <= n : _i >= n; i = 0 <= n ? ++_i : --_i) {
          parser.write(doc.getLine(i) + "\n");
        }
        parser.close();
        return this.validated();
      };

      SAXParser.prototype.validationError = function(text, type) {
        var parser;
        parser = this.$parser;
        return this.$errors.push({
          text: text,
          row: parser.line,
          column: parser.column,
          type: type != null ? type : "error"
        });
      };

      SAXParser.prototype.validated = function() {
        return this.$errors.length === 0;
      };

      return SAXParser;

    })();
    return Angles.Validator.SAX = (function(_super) {

      __extends(SAX, _super);

      function SAX() {
        return SAX.__super__.constructor.apply(this, arguments);
      }

      SAX.prototype.startValidation = function() {
        var els, parser,
          _this = this;
        els = [];
        parser = new SAXParser({
          startDocument: function() {
            return els = [];
          },
          endDocument: function() {
            var e, names;
            if (els.length > 0) {
              names = [];
              for (e in els) {
                names.push(e.name);
              }
              return parser.validationError("Unclosed elements at end of document: " + names.join(", "));
            }
          },
          startElement: function(node) {
            if (els.length > 0) {
              els[0].children.push(node.local);
            }
            els.unshift({
              name: node.local,
              children: []
            });
            return _this.checkSchema(parser, els);
          },
          characters: function(t) {
            if (els.length > 0) {
              if (!(t.match(/^[\s\r\n]*$/) != null)) {
                return els[0].children.push('_text_');
              }
            }
          },
          endElement: function(name) {
            _this.checkChildren(parser, els);
            return els.shift();
          }
        });
        parser.parse(this.$angles.getDocument());
        this.$errors = parser.$errors;
        return this.displayErrors();
      };

      SAX.prototype.checkSchema = function(parser, els) {
        var currentEl, parentEl, rexp;
        if (!(this.$schema != null)) {
          return;
        }
        if (els.length === 1) {
          if (!this.$schema.hasOwnProperty(els[0].name)) {
            return parser.validationError("Invalid root element: " + els[0].name + ".");
          } else {
            rexp = new RegExp(this.$schema._start, "ig");
            if (!(rexp.exec(els[0].name + ",") != null)) {
              return parser.validationError("Unvalid root element: " + els[0].name + ".");
            }
          }
        } else {
          currentEl = els[0].name;
          parentEl = els[1].name;
          if (this.$schema[parentEl].children.indexOf(currentEl) === -1) {
            return parser.validationError("The " + currentEl + " element is not allowed as a child of the " + parentEl + " element.");
          }
        }
      };

      SAX.prototype.checkChildren = function(parser, els) {
        var childNames, currentEl, rexp;
        if (!(this.$schema != null) || els.length === 0) {
          return;
        }
        currentEl = els[0];
        childNames = currentEl.children.join(',');
        if (childNames !== "") {
          childNames += ",";
        }
        if (!this.$schema.hasOwnProperty(currentEl.name)) {
          return;
        }
        if (!this.$schema[currentEl.name].hasOwnProperty("model")) {
          return;
        }
        rexp = new RegExp(this.$schema[currentEl.name].model, "ig");
        if (!(rexp.exec(childNames) != null)) {
          return parser.validationError(currentEl.name + " is invalid: one or more required children are missing or its child elements are in the wrong order.");
        }
      };

      return SAX;

    })(Angles.Validator);
  })(Angles, _, Backbone, ace);

}).call(this);
