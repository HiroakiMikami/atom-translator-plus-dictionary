module.exports =
class NotificationView
  statusBar: null
  translatingNumbers: null

  constructor: ->
    @statusBar = document.createElement("div")
    @statusBar.is = "status-bar-translator-plus-dictionary"
    @statusBar.className = "inline-block"

    @translatingNumbers = 0

  destroy: ->
    @statusBar.remove()
    @statusBar = null

    @translatingNumbers = 0

  started: () =>
    @translatingNumbers += 1
    @updateMessage()

  finished: () =>
    @translatingNumbers -= 1
    @updateMessage()

  failed: (error) ->
    atom.notifications.addError(
      error.kind.name.toString(),
      detail: error.error.message
    )

  updateMessage: ->
    if @translatingNumbers is 0
      @statusBar.innerHTML = ""
    else
      @statusBar.innerHTML = "translating..."
