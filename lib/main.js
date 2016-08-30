'use babel'

let franc = null
let Promise = null
let CompositeDisposable = null
let Range = null
let Emitter = null
let Language = null
let TranslatorPlusDictionary = null
let TranslatorPlusDictionaryView = null
let NotificationView = null
let ExternalApis = null
let MicrosoftTranslatorClient = null
let Dejizo = null
let Configuration = null

let isInitialized = false
function initialize() {
  if (isInitialized) return

  // Initialize modules
  franc = require('franc')
  Promise = require('bluebird')
  const atom = require('atom')
  CompositeDisposable = atom.CompositeDisposable
  Range = atom.Range
  Emitter = atom.Emitter

  // Initialize the local modules
  Language = require('./language')
  TranslatorPlusDictionary = require('./translator-plus-dictionary')
  TranslatorPlusDictionaryView = require('./translator-plus-dictionary-view')
  ExternalApis = require('./external-apis')
  NotificationView = require('./notification-view')
  MicrosoftTranslatorClient = require('./microsoft-translator-client')
  Dejizo = require('./dejizo')
  Configuration = require('./configuration')

  isInitialized = true
}

function getCodeFromName(name) {
  const lang = Language.getFromName(name)
  if (lang) return lang.code
  else return lang
}
function getNameFromCode(code) {
  const lang = Language.getFromCode(code)
  if (lang) return lang.name
  else return lang
}

export default {
  config: {
    microsoftTranslatorClientId: {
      title: 'Client ID of Microsoft Translator API',
      type: 'string',
      default: ''
    },
    microsoftTranslatorClientSecret: {
      title: 'Client Secret of Microsoft Translator API',
      type: 'string',
      default: ''
    },
    languages: {
      title: "Languages used in this package",
      description: "https://github.com/wooorm/franc/blob/master/Supported-Languages.md is a list of languages names.",
      type: 'array',
      default: ['eng', 'jpn'],
      items: {
        type: 'string'
      }
    },
    primaryLanguage: {
      title: "The Primary Language",
      type: 'string',
      default: 'jpn'
    },
    secondaryLanguage: {
      title: "The Secondary Language",
      type: 'string',
      default: 'eng'
    }
  },
  activate() {
    initialize()

    // Initialize the field
    this.subscriptions = new CompositeDisposable()
    this.languages = []
    this.francOptions = { whitelist: [], minLength: 1 }
    this.translatorPlusDictionary = new TranslatorPlusDictionary()
    this.notificationView = new NotificationView()
    this.views = new Map()
    this.emitter = new Emitter()

    // Initialize languages
    this.updateLanguages()

    // Add Microsoft Translator
    const microsoftTranslatorClientId = atom.config.get('translator-plus-dictionary.microsoftTranslatorClientId')
    const microsoftTranslatorClientSecret = atom.config.get('translator-plus-dictionary.microsoftTranslatorClientSecret')
    this.microsoftTranslatorClient = new MicrosoftTranslatorClient(microsoftTranslatorClientId, microsoftTranslatorClientSecret)
    this.translatorPlusDictionary.translators.push(this.microsoftTranslatorClient)

    // Add Dejizo
    const dejizo = new Dejizo()
    this.translatorPlusDictionary.dictionaries.push(dejizo)

    // Load external APIs
    const apis = new ExternalApis()
    apis.load(this.translatorPlusDictionary)

    // Wire translatorPlusDictionary and NotificationView
    this.subscriptions.add(
      this.translatorPlusDictionary.onStarted((x) => { this.notificationView.started(x) })
    )
    this.subscriptions.add(
      this.translatorPlusDictionary.onFinished((x) => { this.notificationView.finished(x) })
    )
    this.subscriptions.add(
      this.translatorPlusDictionary.onFailed((x) => { this.notificationView.failed(x) })
    )

    // Register the commands
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', { 'translator-plus-dictionary:translate': () => this.translate() })
    )
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', { 'translator-plus-dictionary:close-all': () => this.closeAll() })
    )
    this.subscriptions.add(
      atom.commands.add('body', { 'translator-plus-dictionary:configure': () => this.configure() })
    )

    // Observe the configuration
    this.subscriptions.add(
      atom.config.observe(Configuration.getKey(), (value) => {
        this.microsoftTranslatorClient.setClientIdAndSecret(
          value.microsoftTranslatorClientId,
          value.microsoftTranslatorClientSecret
        )
        this.updateLanguages()
      })
    )
  },
  consumeUserSupportHelper(helper) {
    // Add configuration settings
    const panel = helper.getInteractiveConfigurationPanel()
    panel.add(Configuration.getKey('microsoftTranslatorClientId'), {
      type: 'input',
      name: 'Client ID of Microsoft Translator API',
      detail: '<a href="https://www.microsoft.com/en-us/translator/getstarted.aspx">This page</a> helps you to understand how to obtain the client ID.',
      validate: (result) => { return (result.length !== 0) ? true: 'too short' }
    })
    panel.add(Configuration.getKey('microsoftTranslatorClientSecret'), {
      type: 'input',
      name: 'Client Secret of Microsoft Translator API',
      validate: (result) => { return (result.length !== 0) ? true: 'too short' }
    })
    panel.add(Configuration.getKey('languages'), {
      type: 'multipleList',
      name: 'Languages used in this package',
      default: [],
      choices: Language.list.map((elem) => { return elem.name }),
      map: (names) => { return names.map((name) => { return getCodeFromName(name) }) },
      inverseMap: (codes) => { return codes.map((code) => { return getNameFromCode(code) }) },
      validate: (result) => {
        if (result.length >= 2) {
          return true
        } else {
          return "More than 2 language are required"
        }
      }
    })
    panel.add(Configuration.getKey('primaryLanguage'), {
      type: 'list',
      name: 'The primary language',
      message: "The recommended value is your native language.",
      default: '',
      choices: [],
      map: (name) => { return getCodeFromName(name) },
      inverseMap: (code) => { return getNameFromCode(code) }
    })
    panel.add(Configuration.getKey('secondaryLanguage'), {
      type: 'list',
      name: 'The secondary language',
      message: "The recommended value is 'eng'.",
      default: 'eng',
      choices: ['eng'],
      map: (name) => { return getCodeFromName(name) },
      inverseMap: (code) => { return getNameFromCode(code) }
    })

    this.helper = helper

    this.emitter.emit('consumeUserSupportHelper', helper)
  },
  consumeStatusBar(statusBar) {
    // Add a tile to the status bar
    this.statusBarTile = statusBar.addLeftTile({
      item: this.notificationView.statusBar,
      priority: 100
    })
  },
  deactivate() {
    this.views.forEach((view) => view.destory())
    this.subscriptions.dispose()
    if (this.statusBarTile) {
      this.statusBarTile.destory()
    }
    this.notificationView.destory()
  },
  serialize() {},
  closeView(editor, view) {
    for (let i = 0; i < this.views.get(editor).length; i++) {
      if (this.views.get(editor)[i] === view) {
        this.views.get(editor).slice(i, 1)
      }
    }
    view.destroy()

    if (this.views.get(editor).length === 0) {
      editor.getElement().classList.remove('translator-plus-dictionary-active')
    }
  },
  closeAll() {
    const editor = atom.workspace.getActiveTextEditor()

    if (!editor || !this.views.has(editor)) return

    for (const v of this.views.get(editor)) {
      v.destroy()
    }
    this.views.delete(editor)
    editor.getElement().classList.remove('translator-plus-dictionary-active')
  },
  configure() {
    return this.executeAfterConsumeUserSupportHelper().then((helper) => {
      if (!helper) {
        // user-support-helper cannot be used
        return new Promise((resolve) => resolve())
      }
      const panel = helper.getInteractiveConfigurationPanel()
      return panel.show((id, configValues) => {
        switch (id) {
          case null:
            return {
              id: Configuration.getKey("microsoftTranslatorClientId"),
              optional: false,
              finished: false
            }
          case Configuration.getKey("microsoftTranslatorClientId"):
            return {
              id: Configuration.getKey("microsoftTranslatorClientSecret"),
              optional: false,
              finished: false
            }
          case Configuration.getKey("microsoftTranslatorClientSecret"):
            return {
              id: Configuration.getKey("languages"),
              optional: false,
              finished: false
            }
          case Configuration.getKey("languages"):
            return {
              id: Configuration.getKey("primaryLanguage"),
              choices: configValues.get(Configuration.getKey("languages")).map((code) => {
                return getNameFromCode(code)
              }),
              optional: false,
              finished: false
            }
          case Configuration.getKey("primaryLanguage"):
            return {
              id: Configuration.getKey("secondaryLanguage"),
              choices: configValues.get(Configuration.getKey("languages")).map((code) => {
                return getNameFromCode(code)
              }),
              optional: false,
              finished: true
            }
          default:
            return null
        }
      }).then((result) => {
        atom.config.set(Configuration.getKey("configured"), true)
        return result
      })
    })
  },
  configureIfNeeded() {
    const isSetClientIdAndSecret =
      (
        Configuration.getValueWithoutDefault("microsoftTranslatorClientId") &&
        Configuration.getValueWithoutDefault("microsoftTranslatorClientSecret")
      )
    const isSetLanguage =
      (
        Configuration.getValueWithoutDefault("languages") ||
        Configuration.getValueWithoutDefault("secondaryLanguage") ||
        Configuration.getValueWithoutDefault("secondaryLanguage")
      )
    const alreadyConfigured = Configuration.getValue("configured") || false
    if (isSetClientIdAndSecret && (isSetLanguage || alreadyConfigured)) {
      return new Promise((resolve) => resolve())
    } else {
      return this.configure()
    }
  },
  translate() {
    this.configureIfNeeded().then(
      () => {
        // Execute after configuration
        const editor = atom.workspace.getActiveTextEditor()

        if (!editor) return

        atom.workspace.getActiveTextEditor().getElement().classList.add('translator-plus-dictionary-active')

        let targets = []

        // Get texts from selected texts
        for (const range of editor.getSelectedBufferRanges()) {
          if ((range.start.row === range.end.row) && (range.start.column === range.end.column)) continue
          text = editor.getTextInRange(range)
          targets.push({
            range: range,
            text: text
          })
        }

        if (targets.length === 0) {
          // Get words from cursor positions if no text are selected
          for (const cursor of editor.getCursors()) {
            const beginWord = cursor.getBeginningOfCurrentWordBufferPosition()
            const endWord = cursor.getEndOfCurrentWordBufferPosition()
            const range = new Range(beginWord, endWord)

            targets.push({
              range: range,
              text: editor.getTextInRange(range)
            })
          }
        }

        for (const target of targets) {
          // Decide the language of the texts by using frac
          const from = franc(target.text, this.francOptions)
          const lang = Language.getFromCode(from)
          target.from = lang

          // Decide the output language by using the primary and secondary languages
          if (this.primaryLanguage === lang) {
            target.to = this.secondaryLanguage
          } else {
            target.to = this.primaryLanguage
          }

          // Generate a view
          const view = new TranslatorPlusDictionaryView(
            editor, target, this.languages, this.translatorPlusDictionary
          )

          // Add to views
          if (!this.views.has(editor)) {
            this.views.set(editor, [])
          }
          this.views.get(editor).push(view)
          view.onClosed(() => { this.closeView(editor, view) })
        }
      }
    )
  },
  executeAfterConsumeUserSupportHelper() {
    return new Promise((resolve) => {
      if (this.helper) {
        if (!atom.packages.resolvePackagePath("user-support-helper")) {
          // There is no the user-support-helper package.
          resolve(null)
        } else {
          resolve(this.helper)
        }
      } else {
        const disposable = this.emitter.on('consumeUserSupportHelper', (helper) => {
          disposable.dispose()
          resolve(helper)
        })
      }
    })
  },
  updateLanguages() {
    const languageCodes = atom.config.get('translator-plus-dictionary.languages')
    languageCodes.forEach((code) => {
      language = Language.getFromCode(code)
      if (language === null) {
        // TODO notify anerror
        return
      }

      // Store the usable languages information in the form of Language class instances
      this.languages.push(language)
      this.francOptions.whitelist.push(code)
    })

    if (this.languages.length === 0) {
      // Use all languages detected by franc if there is no `languages` configuration.
      this.languages = Language.list
      this.francOptions.whiteList = Language.list.map((e) => { return e.code })
    }

    this.primaryLanguage = Language.getFromCode(atom.config.get('translator-plus-dictionary.primaryLanguage'))
    this.secondaryLanguage = Language.getFromCode(atom.config.get('translator-plus-dictionary.secondaryLanguage'))
  }
}
