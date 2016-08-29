'use babel'

let request = null
let queryString = null
let Promise = null
import Dictionary from './dictionary'

// Constants
const DEJIZO_URL = "http://public.dejizo.jp/NetDicV09.asmx"
const MAX_ITEM_NUM = 2 // TODO should move the configuration

let isInitialized = false
function initialize() {
  if (isInitialized) return

  // Initlaize modules
  request = require('request')
  queryString = require('query-string')
  Promise = require('bluebird')

  isInitialized = true
}

const domParser = new window.DOMParser()

/**
 * [Dejizo](https://dejizo.jp/dev/) is a dictionary API used in Japan.
 */
class Dejizo extends Dictionary {
  constructor() {
    super();
    initialize()
  }
  name() { return "デ辞蔵" }
  canBeUsed(from, to) {
    // REST API supports only English and Japanese.
    if (from.code === "jpn" && to.code === "eng") {
      return true
    } else if (from.code === "eng" && to.code === "jpn") {
      return true
    } else {
      return false
    }
  }
  find(text, from, to) {
    // Decide a dictionary id
    let dictId = null
    switch (from.code) {
      case 'jpn':
        dictId = "EdictJE"
        break;
      case 'eng':
        dictId = "EJdict"
        break;
      default:
    }

    return new Promise((resolve, reject) => {
      if (dictId === null) {
        reject({
          message: `${from.code} cannot be used in Dejizo`
        })
      } else {
        resolve(dictId)
      }
    }).then(
      (dictId) => {
        return new Promise((resolve, reject) => {
          // Call the API via HTTP
          const query = {
            Dic: dictId,
            Word: text,
            Scope: "ANYWHERE",
            Match: "CONTAIN",
            Merge: "AND",
            Prof: "XHTML",
            PageSize: MAX_ITEM_NUM,
            PageIndex: 0
          }
          const options = {
            url: `${DEJIZO_URL}/SearchDicItemLite?${queryString.stringify(query)}`,
            json: false
          }
          request.get(options, (error, response, body) => {
            if (!error || (200 <= response.statusCode  && response.statusCode < 400)) {
              resolve(body)
            } else {
              reject({
                message: "Cannot call Dejizo API",
                statusCode: response.statusCode,
                err: error
              })
            }
          })
        })
      }
    ).then(
      (response) => {
        // Check whether the result is valid
        return new Promise((resolve, reject) => {
          const result = domParser.parseFromString(response, "application/xml")
          const errorMessage = result.getElementsByTagName("ErrorMessage")[0]
          if (!errorMessage || errorMessage.children.length !== 0) {
            reject({
              message: "Some errors are occured in Dejizo API",
              err: errorMessage
            })
          } else {
            const itemIds = []
            const titleList = result.getElementsByTagName("TitleList")[0]
            for (let i = 0; i < titleList.children.length; i++){
              const title = titleList.children[i]
              itemIds.push(title.getElementsByTagName("ItemID")[0].innerHTML)
            }
            resolve(itemIds)
          }
        })
      }
    ).then(
      (itemIds) => {
        // Get content of all items
        let tmpIds = itemIds
        let resultHtml = ""

        return new Promise((resolve, reject) => {
          const getItem = () => {
            // Obtain the content of an item via Dejizo API
            query = {
              Dic: dictId,
              Item: tmpIds[0],
              Loc: "",
              Prof: "XHTML"
            }
            options = {
              url:  `${DEJIZO_URL}/GetDicItemLite?${queryString.stringify(query)}`,
              json: false
            }
            request.get(options, (error, response, body) => {
              if (!error || (200 <= response.statusCode && response.statusCode < 400)) {
                const result =domParser.parseFromString(body, "application/xml")
                const errorMessage = result.getElementsByTagName("ErrorMessage")[0]
                if (!errorMessage || errorMessage.children.length !== 0) {
                  reject({
                    message: "Some errors are occurred in Dejizo API",
                    err: errorMessage
                  })
                } else {
                  // Extract the content
                  const head = result.getElementsByTagName("Head")[0].innerHTML
                  const body = result.getElementsByTagName("Body")[0].innerHTML
                  resultHtml += `${head}${body}`
                  tmpIds.shift()

                  if (tmpIds.length === 0) {
                    resolve(resultHtml)
                  } else {
                    // Process a next item
                    getItem()
                  }
                }
              } else {
                reject({
                  message: "Cannot get the result of the dictionary",
                  statusCode: response.statusCode,
                  err: error
                })
              }
            })
          }

          if (tmpIds.length === 0) {
            resolve(null)
          } else {
            getItem()
          }
        })
      }
    )
  }
}

export default Dejizo
