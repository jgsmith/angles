# --- Validator --- 
#
# Options:
#   events:
#     start (default is "validation:start")
#     end (default is "validation:end")
#     error (default is "validation:error")
#     trigger (default is "validation")
#

class Angles.Validator
  constructor: (@options) ->
    @dispatcher = @options.dispatcher
    @$schema = {}
    @$errors = []
    @$events = @options.events
    @$events ?= {}
    @$events.start ?= "validation:start"
    @$events.end ?= "validation:end"
    @$events.error ?= "validation:error"
    @$events.trigger ?= "validation"
    
    @$angles = @options.anglesView
    
    @dispatcher.on @$events.trigger, =>
      @dispatcher.trigger @$events.start
      @startValidation()

  displayErrors: ->
    $(@errors()).each (idx, e) =>
      @dispatcher.trigger @$events.error, e
    @endValidation()

  startValidation: ->
    console.log "You need to redefine startValidation for your class."
      
  endValidation: ->
    @dispatcher.trigger @$events.end

  setSchema: (s) ->
    @$schema = s
    @dispatcher.trigger @$events.trigger

  errors: -> @$errors

class Angles.Validator.SRV extends Angles.Validator
  constructor: (options) ->
    @$validatorUrl = @options.validator

  startValidation: ->
    # Override this, or provide your own validation handler if your validator returns a different response
    doc = @$angles.getDocument()
    xmlDocument = escape(doc.getValue())
    $.ajax
      url: @$validatorUrl,
      type: "POST",
      crossDomain: true,
      processData: false,
      data: "schema="+@$schema+"&document="+xmlDocument,
      dataType: "jsonp",
      success:  (data) => @processValidationResults(data),
      error: (data) => console.log "Server cannot be reached"

  processValidationResults: (data) ->
    # Override this, or provide your own validation handler if your validator returns a different response
    @$errors = []
    for datum in data
      @$errors.push
        text: datum.message
        row: datum.line-1 # Empirical adjustment. FIX.
        column: datum.column
        type: datum.type
    @displayErrors()
  
#
#  For example:
#    var parser = new SAXParser({
#      startDocument: function() { ... },
#      endDocument: function() { ... },
#      startElement: function(node) { ... },
#      endElement: function(node) { ... },
#      characters: function(text) { ... },
#      comment: function(comment) { ... }
#    });
#
#    parser.parse(editor);
#

# we expect to have the sax-js library available
class SAXParser
  constructor: (@callbacks) ->

  reset: ->
    parser = sax.parser true,
      xmlns: true
      noscript: true
      position: true
  
    if @callbacks.error?
      parser.onerror = (e) =>
        @callbacks.error e
        parser.resume()
    else
      parser.onerror = (e) =>
        @validationError (e.message.split(/\n/))[0] + "."
        parser.resume()

    if @callbacks.characters?
      parser.ontext = (t) =>
        @callbacks.characters t

    if @callbacks.startElement?
      parser.onopentag = (node) =>
        @callbacks.startElement node

    if @callbacks.endElement?
      parser.onclosetag = (name) =>
        @callbacks.endElement name

    if @callbacks.comment
      parser.oncomment = (comment) =>
        @callbacks.comment comment

    if @callbacks.startCdata?
      parser.onopencdata = =>

    if @callbacks.cdata?
      parser.oncdata = (cdata) =>

    if @callbacks.endCdata?
      parser.onclosecdata = =>

    if @callbacks.endDocument?
      parser.onend = =>
        @callbacks.endDocument()

    if @callbacks.startDocument?
      parser.onstart = =>
        @callbacks.startDocument()
    else
      parser.onstart = =>

    @$parser = parser
    @$errors = []

  parse: (doc) ->
    @reset()
    parser = @$parser
    n = doc.getLength()

    parser.onstart()

    parser.write(doc.getLine(i) + "\n") for i in [0..n]
    parser.close();

    @validated()

  validationError: (text, type) ->
    parser = @$parser
    @$errors.push
      text: text
      row: parser.line
      column: parser.column
      type: if type? then type else "error"

  validated: -> @$errors.length == 0

# --- ValidatorSAX - Extends Validator ---

class Angles.Validator.SAX extends Angles.Validator
  startValidation: ->
    els = []
    parser = new SAXParser
      startDocument: () -> els = []
      endDocument: () ->
        if els.length > 0
          names = []
          names.push e.name for e of els
          parser.validationError("Unclosed elements at end of document: " + names.join(", "))
      startElement: (node) =>
        if els.length > 0
          els[0].children.push node.local
        els.unshift
          name: node.local
          children: []
        # check against schema
        @checkSchema parser, els
      characters: (t) ->
        if els.length > 0
          if !t.match(/^[\s\r\n]*$/)?
            els[0].children.push '_text_'
      endElement: (name) =>
        @checkChildren parser,els
        els.shift()
    parser.parse @$angles.getDocument()
    @$errors = parser.$errors
    @displayErrors()

  checkSchema: (parser, els) ->
    if !@$schema?
      return
    if els.length == 1
      if !@$schema.hasOwnProperty(els[0].name)
        parser.validationError "Invalid root element: #{els[0].name}."
      else
        rexp = new RegExp @$schema._start, "ig"
        if !rexp.exec(els[0].name+",")?
          parser.validationError "Unvalid root element: #{els[0].name}."
    else
      currentEl = els[0].name
      parentEl = els[1].name

      if this.$schema[parentEl].children.indexOf(currentEl) == -1
        parser.validationError "The " + currentEl + " element is not allowed as a child of the " + parentEl + " element."

  checkChildren: (parser, els) ->
    if !@$schema? or els.length == 0
      return

    # we only need the last element
    currentEl = els[0]
    childNames = currentEl.children.join(',')
    if childNames != ""
      childNames += ","

    if !this.$schema.hasOwnProperty(currentEl.name)
      return
    if !this.$schema[currentEl.name].hasOwnProperty("model")
      return

    rexp = new RegExp @$schema[currentEl.name].model, "ig"
    if !rexp.exec(childNames)?
      parser.validationError currentEl.name + " is invalid: one or more required children are missing or its child elements are in the wrong order."