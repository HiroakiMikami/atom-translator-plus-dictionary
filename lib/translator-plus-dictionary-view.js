'use babel'

let fs = null
let loophole = null
let allowUnsafeEval = null
let allowUnsafeNewFunction = null
let pug = null
let Promise = null
let Emitter = null
let Language = null
let PUG_DIRECTORY_PATH = null

let isInitialized = false
function initialize() {
  if (isInitialized) return

  // Initialize a module
  fs = require('fs')
  loophole = require('loophole')
  allowUnsafeEval = loophole.allowUnsafeEval
  allowUnsafeNewFunction = loophole.allowUnsafeNewFunction
  Promise = require('bluebird')
  Emitter = require('atom').Emitter
  Language = require('./language')
  PUG_DIRECTORY_PATH = require('./constants').PUG_DIRECTORY_PATH

  isInitialized = true
}

function initializeTemplates(viewTemplateGenerated, resultTemplateGenerated) {
  const initilizeViewTempalte = (callback) => {
    if (TranslatorPlusDictionaryView.viewTemplate) {
      // The template for this view is initialized already
      callback()
    } else {
      // Initialize a template for this view.
      allowUnsafeEval(() => {
        allowUnsafeNewFunction(() => {
          if (!pug) pug = require('pug')
          TranslatorPlusDictionaryView.viewTemplate = pug.compileFile(`${PUG_DIRECTORY_PATH}/translator-plus-dictionary-view.pug`);
          callback()
        })
      })
    }
  }

  const initializeResultTemplte = (callback) => {
    if (TranslatorPlusDictionaryView.resultTemplate) {
      // The template for the result is initialized already
      callback()
    } else {
      // Initialize a template for the result.
      allowUnsafeEval(() => {
        allowUnsafeNewFunction(() => {
          if (!pug) pug = require('pug')
          TranslatorPlusDictionaryView.resultTemplate = pug.compileFile(`${PUG_DIRECTORY_PATH}/result.pug`);
          callback()
        })
      })
    }
  }

  // Initialize viewTemplate first, then initialize resultTemplate
  initilizeViewTempalte(() => {
    viewTemplateGenerated()
    initializeResultTemplte(() => resultTemplateGenerated())
  })
}

export default class TranslatorPlusDictionaryView {
  constructor(editor, target, languages, translatorPlusDictionary) {
    initialize()

    // Initialize fields
    this.emitter = new Emitter()
    this.results = {}
    this.text = target.text
    this.translatorPlusDictionary = translatorPlusDictionary

    // Initialize templates of Hogan.js
    initializeTemplates(
      () => {
        // Generate the view by using a template
        this.element = document.createElement("div")
        this.element.innerHTML = TranslatorPlusDictionaryView.viewTemplate({ languages: languages })
        this.marker = editor.markBufferRange(target.range)
        this.decoration = editor.decorateMarker(this.marker, {
          type: 'overlay',
          item: this.element,
          position: 'tail',
          class: 'translator-plus-dictionary-view'
        })

        this.fromLanguage = this.element.getElementsByClassName("from")[0]
        this.toLanguage = this.element.getElementsByClassName("to")[0]
        this.closeIcon = this.element.getElementsByClassName("close-icon")[0]
        this.content = this.element.getElementsByClassName("content")[0]

        // Set a event listener
        this.closeIcon.addEventListener("click", () => this.emitter.emit("Closed"))
        // Set default languges
        if (target.from) {
          let index = null
          let i = 0
          for (let i = 0; i < this.fromLanguage.children.length; i++) {
            const opt = this.fromLanguage.children[i]
            if (opt.value === target.from.code) {
              index = i
              break
            }
          }
          if (index) {
            this.fromLanguage.selectedIndex = index
          } else {
            this.fromLanguage.selectedIndex = 0
          }
        }
        if (target.to) {
          let index = null
          let i = 0
          for (let i = 0; i < this.toLanguage.children.length; i++) {
            const opt = this.toLanguage.children[i]
            if (opt.value === target.to.code) {
              index = i
              break
            }
          }
          if (index) {
            this.toLanguage.selectedIndex = index
          } else {
            this.toLanguage.selectedIndex = 0
          }
        }
      },
      () => {
        // Set event listeners
        this.fromLanguage.addEventListener("change", () => this.changed)
        this.toLanguage.addEventListener("change", () => this.changed)

        // Translate if the languages are set
        this.changed()
      }
    )
  }
  onClosed(callback) {
    this.emitter.on("Closed", callback)
  }
  changed() {
    const fromCode = this.fromLanguage.options[this.fromLanguage.selectedIndex].value
    const toCode = this.toLanguage.options[this.toLanguage.selectedIndex].value

    if (fromCode === toCode) return
    if (fromCode === "none" || toCode === "none") return

    const from = Language.getFromCode(fromCode)
    const to = Language.getFromCode(toCode)

    if (!from || !to) return

    // Translate the text
    this.translatorPlusDictionary.translate(
      this.text, from, to,
      (kind, result) => {
        // Show the result
        resultDom = this.results[kind.name]
        if (!resultDom) {
          resultDom = document.createElement("div")
          resultDom.className = "result"
          this.content.appendChild(resultDom)

          this.results[kind.name] = resultDom
        }

        resultDom.innerHTML = TranslatorPlusDictionaryView.resultTemplate({
          name: kind.name,
          data: result
        })
      },
      () => {}
    )
  }
  destroy() {
    for (const key in this.results) {
      const value = this.results[key]
      value.remove()
    }
    this.emitter.dispose()
    if (this.decoration) {
      this.decoration.destroy()
    }
    if (this.marker) {
      this.marker.destroy()
    }
    if (this.element) {
      this.element.remove()
    }
  }
}
