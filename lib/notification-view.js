'use babel'

export default class NotificationView {
  constructor() {
    // Initialize fields
    this.statusBar = document.createElement("div")
    this.statusBar.is = "status-bar-translator-plus-dictionary"
    this.statusBar.className = "inline-block"

    this.translatingNumbers = 0
  }
  destroy() {
    this.statusBar.remove()
    this.statusBar = null

    this.translatingNumbers = 0
  }
  started() {
    this.translatingNumbers += 1
    this.updateMessage()
  }
  finished() {
    this.translatingNumbers -= 1
    this.updateMessage()
  }
  failed(error) {
    atom.notifications.addError(
      error.kind.name.toString(),
      { detail: error.error.message }
    )
  }
  updateMessage() {
    if (this.translatingNumbers === 0) {
      this.statusBar.innerHTML = ""
    } else {
      this.statusBar.innerHTML = "translating..."
    }
  }
}
