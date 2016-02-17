# Modules
request = null
queryString = null
htmlparser = null
Promise = null
Translator = require('./translator')
Language = null

module.exports =
class MicrosoftTranslatorClient extends Translator
  # Constants used to call Microft Translator APIs
  @accessTokenURI: 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13'
  @translateURL: 'http://api.microsofttranslator.com/V2/Http.svc/Translate'
  @scope: 'http://api.microsofttranslator.com'
  @grantType: 'client_credentials'

  accessTokenRequestOptions = null
  accessToken = null

  name: -> "Microsoft Translator"

  constructor: (clientId, clientSecret) ->
    # Initialize the modules
    request ?= require('request')
    queryString ?= require("query-string")
    htmlparser ?= require("htmlparser")
    Promise ?= require 'bluebird'
    Language ?= require('./language')

    # Initialize a field
    @accessTokenRequestOptions ?=
      uri: MicrosoftTranslatorClient.accessTokenURI
      form:
        client_id: clientId
        client_secret: clientSecret
        scope: MicrosoftTranslatorClient.scope
        grant_type: MicrosoftTranslatorClient.grantType
      json: true

  languageToCode: (language) ->
    # Language code: https://msdn.microsoft.com/en-us/library/hh456380.aspx
    switch language.code
      when "cmn"
        "zh-CHS" # TODO I do not know the difference of zu-CHS, zu-CHT, and Mandarin Chinise
      when "spa"
        "es"
      when "eng"
        "en"
      when "rus"
        "ru"
      when "arb"
        "ar"
      when "hin"
        "hi"
      when "por"
        "pt"
      when "ind"
        "id"
      when "jpn"
        "ja"
      when "fra"
        "fr"
      when "deu"
        "de"
      when "kor"
        "ko"
      when "vie"
        "vi"
      when "ita"
        "it"
      when "tur"
        "tr"
      when "urd"
        "ur"
      when "pol"
        "pl"
      when "ukr"
        "uk"
      when "mal"
        "mt"
      when "swh"
        "sw"
      when "ron"
        "ro"
      when "bos"
        "bs-Latn"
      when "hrv"
        "hr"
      when "Dutch"
        "nl"
      when "srp"
        "sr-Latn" # TODO sr-Cyrl?
      when "tha"
        "th"
      when "ell"
        "el"
      when "ces"
        "cs"
      when "bul"
        "bg"
      when "swe"
        "sv"
      when "hat"
        "ht"
      when "fin"
        "fi"
      when "slk"
        "sk"
      when "dan"
        "da"
      when "heb"
        "he"
      when "cat"
        "ca"
      when "lit"
        "lt"
      when "slv"
        "sl"
      when "lav"
        "lv"
      when "est"
        "et"
      else
        null

  canBeUsed: (from, to) -> @languageToCode(from)? and @languageToCode(to)

  translate: (text, from, to, succeeded, failed) ->
    fromCode = @languageToCode(from)
    toCode = @languageToCode(to)
    new Promise((resolve, reject) =>
      if not fromCode?
        reject({
          message: "#{from.name} cannot be used in Microsoft Translator"
        })
      else if not toCode?
        reject({
          message: "#{to.name} cannot be used in Microsoft Translator"
        })
      else
        # Check whether the previous access token is valid
        currentTime = new Date().getTime()
        if @accessToken? && @accessToken.expired > currentTime
          # Valid
          resolve(@accessToken.token)
        else
          requestedTime = new Date().getTime()
          # Get an access token via API if the previous access token is invalid
          request.post(@accessTokenRequestOptions, (error, response, body) =>
            if !error? || 200 <= response.statusCode < 400
              # Update the access token
              if body.expires_in?
                @accessToken = {
                  token: body.access_token
                  expired: requestedTime + body.expires_in * 1000 # sec -> msec
                }
              resolve(body.access_token)
            else
              reject({
                message: "Cannot obtain an access token"
                statusCode: response.statusCode
                err: error
              })
          )
    ).then(
      (token) =>
        # Translate via Microft Translator API
        query =
          appId: "Bearer #{token}"
          text: text
          to: toCode
          from: fromCode
        options =
          url: "#{MicrosoftTranslatorClient.translateURL}?#{queryString.stringify(query)}"
          json: true

        new Promise((resolve, reject) =>
          request.get(options, (error, response, body) =>
            if !error || 200 <= response.statusCode < 400
              resolve(body)
            else
              reject({
                message: "Cannot translate via MS Translator API"
                statusCode: response.statusCode
                err: error
              })
          )
        )
      ,
      (error) => error
    ).then(
      (result) =>
        # Parse the result
        new Promise( (resolve, reject) ->
          handler = new htmlparser.DefaultHandler((error, dom) =>
            if error
              reject({
                message: "Cannot parse the API result"
                err: error
              })
            else
              resolve(dom[0].children[0].data)
          )
          parser = new htmlparser.Parser(handler)
          parser.parseComplete(result)
        )
      ,
      (error) => error
    ).then(
      (result) =>
        succeeded(result)
        return
      ,
      (error) =>
        failed(error)
        return
    )
