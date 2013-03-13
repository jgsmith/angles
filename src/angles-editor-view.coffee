#
# Events managed in the ACEEditorView.dispather:
#
#   editor:change - an editor change event
#   editor:reload - force the editor to reload content from the model
#   editor:error  - an error reported by the editor or wrapper
#
#   document:switch  - a request to change the document the editor is editing
#   document:save    - a request to save the document currently in the editor
#
#   validation:start - notice that validation is beginning
#   validation:end   - notice that validation has finished
#   validation:error - the report of a validation error
#
# If you replace the Angles.ACEEditorView with a different view to wrap
# a different editor, you will need to implement a getDocument() function
# that returns the same properties as the one here, but with data from
# your editor instance. This lets the validator not depend on the ACE
# API.
#
# To provide different storage for the collection, replace 
# Angles.XMLDocumentList (here, we're using local storage):
#
#  Angles.XMLDocumentList = Backbone.Collection.extend({
#    mode: Angles.XMLDocument,
#    localStorage: new Backbone.LocalStorage("SomeCollection")
#  });
#

# XMLDocument
class Angles.XMLDocument extends Backbone.Model
  defaults:
    "name": "untitled"
    "content": ""
  validate: (attrs) ->
    if !attrs.name?
      return "document must have a name"
    if attrs.name =~ /^\s*$/
      return "document must have a name"

# XMLDocument List
class Angles.XMLDocumentList extends Backbone.Collection
  model: Angles.XMLDocument

#
# This file selector will list the documents in the Angles.XMLDocumentList
# collection and allow selection of a document.
#
# Fires a document:change event when the selected file is to be loaded
# into the editor. The event's data parameter is the model object from
# which to get the content.
#
# options:
#
# * el: element into which this view should be rendered
# * dispatcher: dispatcher object to use for events
# * collection: collection of models from which a model should be selected
#
# template classes:
#   .file-list - list of files - new files are appended to the end
#   .new-file  - element that triggers a new file dialog
#

_.templateSettings =
  interpolate: /\{\{(.+?)\}\}/g
  escape: /\{\{-(.+?)\}\}/g

class Angles.FileSelector extends Backbone.View
  initialize: ->
   @template = _.template $('#file-list-template').html()

  render: () ->
    @$el.html @template {}
    @collection.each @addOne, this
    this

  addOne: (model) ->
    view = new Angles.FileSelectorRow
      model: model
    @$("form").append view.render().$el

class Angles.FileSelectorRow extends Backbone.View
  initialize: ->
    @template = _.template $('#file-item-template').html()
    @listenTo @model, 'change', @render
    @listenTo @model, 'destroy', @remove

  render: ->
    @$el.html @template @model.toJSON()
    this

#
# We intend ACEEditorView to be a singleton class for a particular area
# on the page - not to be instantiated for each document in the collection.
#
# You may pass a dispatcher object into the initializer if you want to
# use one from another application to allow integration.
#
class Angles.ACEEditorView extends Backbone.View
  tagName: "div"
  className: "ace-editor"

  initialize: ->
    annotations = []
    dispatcher = @options.dispatcher 
    dispatcher ?= _.clone Backbone.Events
    @dispatcher = dispatcher

   	dispatcher.on "editor:reload", =>
      @clearAnnotations()
      @setContent()

    dispatcher.on "document:save", =>
      @saveModel()

    dispatcher.on "validation:start", ->
      annotations = []

    dispatcher.on "validation:error", (e) ->
      annotations.push(e)

    dispatcher.on "validation:end", =>
      select = @$editor.getSelection()

      @clearAnnotations()
      @$editor.focus()
      if annotations.length > 0
        @$editor.gotoLine annotations[0].row+1, annotations[0].column, true
        select.selectWordLeft()
        select.selectWordLeft()
      @$editor.session.setAnnotations annotations

    dispatcher.on "document:switch", (e) =>
      @setModel(e)

  render: ->
    @$editor = ace.edit(@el)
    @$editor.getSession().on 'change', (e) =>
      @dispatcher.trigger('editor:change', e)
    @$editor.getSession().setMode "ace/mode/xml"
    this

  setContent: -> @$editor.setValue @model.get('content')

  getContent: -> @$editor.getValue()

  getDocument: ->
    return {
      getValue: => @$editor.getValue()
      getLength: => @$editor.session.getDocument().getLength()
      getLine: (n) => @$editor.session.getDocument().getLine(n)
    }

  saveModel: ->
    @model.set 'content', @getContent()
    @model.save
      success: =>
        @model = m;
        @dispatcher.trigger "editor:reload"
      error: =>
        @dispatcher.trigger "editor:error", "Unable to change document"

  setModel: (m) ->
    @model = m
    @dispatcher.trigger "editor:reload"

  clearAnnotations: -> @$editor.session.clearAnnotations()

  setMode: (m) -> @$editor.getSession().setMode m