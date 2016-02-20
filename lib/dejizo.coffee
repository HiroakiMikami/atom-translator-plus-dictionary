# Modules
request = null
queryString = null
Promise = null
Dictionary = require('./dictionary')

# Constants
DEJIZO_URL = "http://public.dejizo.jp/NetDicV09.asmx"
MAX_ITEM_NUM = 2 # TODO should move the configuration

###
[Dejizo](https://dejizo.jp/dev/) is a dictionary API used in Japan.
###
module.exports =
class Dejizo extends Dictionary
  @domParser: null

  constructor: () ->
    # Initlaize modules
    request ?= require('request')
    queryString ?= require('query-string')
    Promise ?= require 'bluebird'

    # Initialize a static field
    Dejizo.domParser ?= new window.DOMParser()

  name: -> "デ辞蔵"
  canBeUsed: (from, to) ->
    # REST API supports only English and Japanese.
    if from.code == "jpn" && to.code == "eng"
      return true
    else if from.code == "eng" && to.code == "jpn"
      return true
    else
      return false

  find: (text, from, to, succeeded, failed) ->
    # Decide a dictionary id
    switch from.code
      when "jpn"
        dictId = "EdictJE"
      when "eng"
        dictId = "EJdict"
    new Promise((resolve, reject) ->
      if from.code != "jpn" && from.code != "eng"
        reject({
          message: "#{from.name} cannot be used in Dejizo"
        })
      else if to.code != "jpn" && to.code != "eng"
        reject({
          message: "#{from.name} cannot be used in Dejizo"
        })
      else
        # Call the API via HTTP
        query =
          Dic: dictId
          Word: text
          Scope: "ANYWHERE"
          Match: "CONTAIN"
          Merge: "AND"
          Prof: "XHTML"
          PageSize: MAX_ITEM_NUM
          PageIndex: 0
        options =
          url: "#{DEJIZO_URL}/SearchDicItemLite?#{queryString.stringify(query)}"
          json: false
        request.get(options, (error, response, body) =>
          if !error || 200 <= response.statusCode < 400
            resolve(body)
          else
            reject({
              message: "Cannot call Dejizo API"
              statusCode: response.statusCode
              err: error
            })
        )
    ).then(
      (response) =>
        # Check whether the result is valid
        new Promise((resolve, reject) ->
          result = Dejizo.domParser.parseFromString(response, "application/xml")
          errorMessages = result.getElementsByTagName("ErrorMessage")[0]
          if not errorMessages? || errorMessages.children.length != 0
            reject({
              message: "Some errors are occurred in Dejizo API"
              err: errorMessages
            })
          else
            itemIds = []
            titleList = result.getElementsByTagName("TitleList")[0]
            for title in titleList.children
              itemIds.push(title.getElementsByTagName("ItemID")[0].innerHTML)
            resolve(itemIds)
        )
      (error) -> error
    ).then(
      (itemIds) ->
        # Get content of all items
        tmpIds = itemIds

        resultHtml = ""

        new Promise((resolve, reject) ->
          getItem = ()->
            # Obtain the content of an item via Dejizo API
            query =
              Dic: dictId
              Item: tmpIds[0]
              Loc: ""
              Prof: "XHTML"
            options =
              url:  "#{DEJIZO_URL}/GetDicItemLite?#{queryString.stringify(query)}"
              json: false
            request.get(options, (error, response, body) =>
              if !error || 200 <= response.statusCode < 400
                result = Dejizo.domParser.parseFromString(body, "application/xml")
                errorMessages = result.getElementsByTagName("ErrorMessage")[0]
                if (not errorMessages?) || errorMessages.children.length != 0
                  reject({
                    message: "Some errors are occurred in Dejizo API"
                    err: errorMessages
                  })
                else
                  # Extract the content
                  head = result.getElementsByTagName("Head")[0].innerHTML
                  body = result.getElementsByTagName("Body")[0].innerHTML
                  resultHtml += "#{head}#{body}"
                  tmpIds.shift()

                  if tmpIds.length == 0
                    resolve(resultHtml)
                  else
                    # Process a next item
                    getItem()
              else
                reject({
                  message: "Cannot get the result of the dictionary"
                  statusCode: response.statusCode
                  err: error
                })
            )
          if tmpIds.length == 0
            reject(null)
          else
            getItem()
        )
      (error) -> error
    ).then(
      (result) ->
        succeeded(result)
        return
      (error) ->
        if error != null
          failed(error)
        return
    )
