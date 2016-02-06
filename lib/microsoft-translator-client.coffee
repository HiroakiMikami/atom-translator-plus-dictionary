request = null
queryString = null
htmlparser = null

module.exports =
class MicrosoftTranslatorClient
  # Constants used to call Microft Translator APIs
  @accessTokenURI: 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13'
  @translateURL: 'http://api.microsofttranslator.com/V2/Http.svc/Translate'
  @scope: 'http://api.microsofttranslator.com'
  @grantType: 'client_credentials'

  accessTokenRequestOptions = null
  accessToken = null

  constructor: (clientId, clientSecret) ->
    # Initialize the modules
    request ?= require('request')
    queryString ?= require("query-string")
    htmlparser ?= require("htmlparser")

    @accessTokenRequestOptions ?=
      uri: MicrosoftTranslatorClient.accessTokenURI
      form:
        client_id: clientId
        client_secret: clientSecret
        scope: MicrosoftTranslatorClient.scope
        grant_type: MicrosoftTranslatorClient.grantType
      json: true

  translate: (text, from, to, onSucceeded, onFailed) ->
    new Promise((resolve, reject) =>
      # Check whether the previous access token is valid
      currentTime = new Date().getTime()
      if @accessToken? && @accessToken.expired > currentTime
        # Valid
        resolve(@accessToken.token)
      else
        console.log("access token", @accessToken)
        requestedTime = new Date().getTime()
        # Invalid, get an access token via API
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
          to: to
          from: from
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
        onSucceeded(result)
        return
      ,
      (error) =>
        onFailed(error)
        return
    )
