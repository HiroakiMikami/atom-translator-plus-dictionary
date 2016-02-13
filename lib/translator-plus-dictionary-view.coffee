hogan = null
fs = null
loophole = null
allowUnsafeEval = null
allowUnsafeNewFunction = null
Emitter = null
Language = null

module.exports =
class TranslatorPlusDictionaryView
  @viewTemplate: null
  @resultTemplate: null

  element: null
  fromLanguage: null
  toLanguage: null
  closeIcon: null
  content: null
  results: null

  emitter: null

  @initializeTemplates: (viewTemplateGenerated, resultTemplateGenerated) ->
    initilizeViewTempalte = (callback) ->
      if TranslatorPlusDictionaryView.viewTemplate?
        callback()
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
            callback()
          ,
          (err) -> atom.notifications.addError(err.toString())
        )
    initializeResultTemplte = (callback) ->
      if TranslatorPlusDictionaryView.resultTemplate?
        callback()
      else
        # Initialize a template for the result.
        new Promise((resolve, reject) ->
          fs.readFile(
            "#{atom.configDirPath}/packages/translator-plus-dictionary/hogan-templates/result.html",
            'utf8'
            (err, data) ->
              if err
                reject(err)
              else
                resolve(data)
          )
        ).then(
          (data) -> allowUnsafeEval -> allowUnsafeNewFunction ->
            TranslatorPlusDictionaryView.resultTemplate = hogan.compile(data)
            resultTemplateGenerated()
          ,
          (err) -> atom.notifications.addError(err.toString())
        )

    # Initialize viewTemplate first, then initialize resultTemplate
    initilizeViewTempalte(->
      viewTemplateGenerated()
      initializeResultTemplte(-> resultTemplateGenerated())
    )


  constructor: (editor, target, languages, @translatorPlusDictionary) ->
    @text = target.text

    # Initialize a module
    fs ?= require('fs')
    hogan ?= require('hogan.js')
    loophole ?= require 'loophole'
    allowUnsafeEval ?= loophole.allowUnsafeEval
    allowUnsafeNewFunction ?= loophole.allowUnsafeNewFunction
    Emitter ?= require('atom').Emitter
    Language ?= require('./language')

    # Initialize fields
    @emitter = new Emitter
    @results = {}

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
        @content = @element.getElementsByClassName("content")[0]

        # Set a event listener
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
      ,
      () =>
        # Set event listeners
        @fromLanguage.addEventListener("change", @changed)
        @toLanguage.addEventListener("change", @changed)

        @changed()
    )

  onClosed: (callback) -> @emitter.on("Closed", callback)

  changed: =>
    fromCode = @fromLanguage.options[@fromLanguage.selectedIndex].value
    toCode = @toLanguage.options[@toLanguage.selectedIndex].value

    if fromCode == toCode then return
    if fromCode == "none" || toCode == "none" then return

    from = Language.getFromCode(fromCode)
    to = Language.getFromCode(toCode)

    return unless from? && to?

    @translatorPlusDictionary.translate(
      @text, from, to,
      (kind, result) =>
        resultDom = @results[kind]
        if not resultDom?
          resultDom = document.createElement("div")
          resultDom.className = "result"
          @content.appendChild(resultDom)

          @results[kind] = resultDom

        resultDom.innerHTML = TranslatorPlusDictionaryView.resultTemplate.render({
          name: kind.name
          data: result
        })
      ->
    )

  destroy: ->
    for key, value of @results
      value.remove()
    @emitter.dispose()
    @decoration?.destroy()
    @marker?.destroy()
    @element?.remove()
