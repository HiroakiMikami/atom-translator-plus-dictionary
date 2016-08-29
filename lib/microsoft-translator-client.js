'use babel'

let request = null
let queryString = null
let htmlparser = null
let Promise = null
let Language = null
import Translator from './translator'

// Constants used to call Microft Translator APIs
const ACCESS_TOKEN_URI = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13'
const TRANSLATE_URL = 'http://api.microsofttranslator.com/V2/Http.svc/Translate'
const SCOPE = 'http://api.microsofttranslator.com'
const GRANT_TYPE = 'client_credentials'

let isInitialized = false
function initialize() {
  if (isInitialized) return

  //Initialize the modules
  request = require('request')
  queryString = require("query-string")
  htmlparser = require("htmlparser")
  Promise = require('bluebird')
  Language = require('./language')

  isInitialized = true
}

class MicrosoftTranslatorClient extends Translator {
  name() { return "Microsoft Translator" }
  constructor(clientId, clientSecret) {
    super()

    initialize()

    // Initialize a field
    this.accessTokenRequestOptions = {
      uri: ACCESS_TOKEN_URI,
      form: {
        client_id: clientId,
        client_secret: clientSecret,
        scope: SCOPE,
        grant_type: GRANT_TYPE,
      },
      json: true
    }
  }
  canBeUsed(from, to) {
    const x1 = MicrosoftTranslatorClient.languageToCode(from)
    const x2 = MicrosoftTranslatorClient.languageToCode(to)
    if (x1 && x2) return true
    else return false
  }

  translate(text, from, to) {
    const fromCode = MicrosoftTranslatorClient.languageToCode(from)
    const toCode = MicrosoftTranslatorClient.languageToCode(to)
    return new Promise((resolve, reject) => {
      if (!fromCode) {
        reject ({
          message: `${from.name} cannot be used in Microsoft Translator`
        })
      } else if (!toCode) {
        reject ({
          message: `${to.name} cannot be used in Microsoft Translator`
        })
      } else {
        // Check whether the previous access token is valid
        const currentTime = new Date().getTime()
        if (this.accessToken && this.accessToken.expired > currentTime) {
          // valid
          resolve(this.accessToken.token)
        } else {
          const requestedTime = new Date().getTime()
          // Get an access token via API if the previous access token is invalid
          request.post(this.accessTokenRequestOptions, (error, response, body) => {
            if (!error || (200 <= response.statusCode && response.statusCode < 400)) {
              // Update the access token
              if (body.expires_in) {
                this.accessToken = {
                  token: body.access_token,
                  expired: requestedTime + body.expires_in * 1000 // sec -> msec
                }
              }
              resolve(body.access_token)
            } else {
              reject({
                message: "Cannot obtain an access token",
                statusCode: response.statusCode,
                err: error
              })
            }
          })
        }
      }
    }).then(
      (token) => {
        // Translate via Microft Translator API
        const query = {
          appId: `Bearer ${token}`,
          text: text,
          to: toCode,
          from: fromCode,
        }
        const options = {
          url: `${TRANSLATE_URL}?${queryString.stringify(query)}`,
          json: true
        }

        return new Promise((resolve, reject) => {
          request.get(options, (error, response, body) => {
            if (!error || (200 <= response.statusCode && response.statusCode < 400)) {
              resolve(body)
            } else {
              reject({
                message: "Cannot translate via MS Translator API",
                statusCode: response.statusCode,
                err: error
              })
            }
          })
        })
      }
    ).then(
      (result) => {
        // Parse the result
        return new Promise((resolve, reject) => {
          const handler = new htmlparser.DefaultHandler((error, dom) => {
            if (error) {
              reject({
                message: "Cannot parse the API result",
                err: error
              })
            } else {
              resolve(dom[0].children[0].data)
            }
          })
          const parser = new htmlparser.Parser(handler)
          parser.parseComplete(result)
        })
      }
    )
  }

  static languageToCode (language) {
    // Language code: https://msdn.microsoft.com/en-us/library/hh456380.aspx
    switch (language.code) {
      case "cmn":
        return "zh-CHS" // TODO I do not know the difference of zu-CHS, zu-CHT, and Mandarin Chinise
      case "spa":
        return "es"
      case "eng":
        return "en"
      case "rus":
        return "ru"
      case "arb":
        return "ar"
      case "hin":
        return "hi"
      case "por":
        return "pt"
      case "ind":
        return "id"
      case "jpn":
        return "ja"
      case "fra":
        return "fr"
      case "deu":
        return "de"
      case "kor":
        return "ko"
      case "vie":
        return "vi"
      case "ita":
        return "it"
      case "tur":
        return "tr"
      case "urd":
        return "ur"
      case "pol":
        return "pl"
      case "ukr":
        return "uk"
      case "mal":
        return "mt"
      case "swh":
        return "sw"
      case "ron":
        return "ro"
      case "bos":
        return "bs-Latn"
      case "hrv":
        return "hr"
      case "Dutch":
        return "nl"
      case "srp":
        return "sr-Latn" // TODO sr-Cyrl?
      case "tha":
        return "th"
      case "ell":
        return "el"
      case "ces":
        return "cs"
      case "bul":
        return "bg"
      case "swe":
        return "sv"
      case "hat":
        return "ht"
      case "fin":
        return "fi"
      case "slk":
        return "sk"
      case "dan":
        return "da"
      case "heb":
        return "he"
      case "cat":
        return "ca"
      case "lit":
        return "lt"
      case "slv":
        return "sl"
      case "lav":
        return "lv"
      case "est":
        return "et"
      default:
        null
    }
  }
}
export default MicrosoftTranslatorClient
