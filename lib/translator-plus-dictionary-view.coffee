hogan = null
fs = null
loophole = null
allowUnsafeEval = null
allowUnsafeNewFunction = null
Emitter = null

module.exports =
class TranslatorPlusDictionaryView
  @viewTemplate: null

  element: null
  fromLanguage: null
  toLanguage: null
  closeIcon: null
  content: null

  emitter: null

  @initializeTemplates: (viewTemplateGenerated) ->
    if TranslatorPlusDictionaryView.viewTemplate?
      viewTemplateGenerated()
    else
      # Initialize a template for this view.
      new Promise((resolve, reject) ->
        fs.readFile(
          "#{atom.configDirPath}/packages/translator-plus-dictionary/hogan-templates/translator-plus-dictionary-view.html",
          'utf8'
          (err, data) ->
            if err
              reject(err)
            else
              resolve(data)
        )
      ).then(
        (data) -> allowUnsafeEval -> allowUnsafeNewFunction ->
          TranslatorPlusDictionaryView.viewTemplate = hogan.compile(data)
          viewTemplateGenerated()
        ,
        (err) -> atom.notifications.addError(err.toString())
      )

  constructor: (editor, target, languages) ->
    # Initialize a module
    fs ?= require('fs')
    hogan ?= require('hogan.js')
    loophole ?= require 'loophole'
    allowUnsafeEval ?= loophole.allowUnsafeEval
    allowUnsafeNewFunction ?= loophole.allowUnsafeNewFunction
    Emitter ?= require('atom').Emitter

    # Initialize fields
    @emitter = new Emitter

    # Initialize templates of Hogan.js
    TranslatorPlusDictionaryView.initializeTemplates(
      () =>
        # Generate the view by using a template
        @element = document.createElement("div")
        @element.innerHTML = TranslatorPlusDictionaryView.viewTemplate.render(languages: languages)
        @marker = editor.markBufferRange(target.range)
        @decoration = editor.decorateMarker(@marker, {
          type: 'overlay'
          item: @element
          position: 'tail'
          class: 'translator-plus-dictionary-view'
        })

        @fromLanguage = @element.getElementsByClassName("from")[0]
        @toLanguage = @element.getElementsByClassName("to")[0]
        @closeIcon = @element.getElementsByClassName("close-icon")[0]

        # Set event listeners
        @closeIcon.addEventListener("click", () => @emitter.emit("Closed"))

        # Set default languges
        if target.from?
          i = 0
          for opt in @fromLanguage.children
            if opt.value == target.from.code
              break
            i += 1
          @fromLanguage.selectedIndex = i
        if target.to?
          i = 0
          for opt in @toLanguage.children
            if opt.value == target.to.code
              break
            i += 1
          @toLanguage.selectedIndex = i
    )

  onClosed: (callback) -> @emitter.on("Closed", callback)

  destroy: ->
    @emitter.dispose()
    @decoration?.destroy()
    @marker?.destroy()
    @element?.remove()
