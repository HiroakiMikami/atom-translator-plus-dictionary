'use babel'

import NotificationView from '../lib/notification-view';

describe('NotificationView', () => {
  describe('when the "started" is called', () => {
    it('shows "translating..." message.', () => {
      const view = new NotificationView()
      view.started()
      expect(view.statusBar.innerHTML).toBe("translating...")
    })
  })
  describe('when the "finished" is called', () => {
    it('hides "translating..." message.', () => {
      const view = new NotificationView()
      view.started()
      view.started()
      view.finished()
      expect(view.statusBar.innerHTML).toBe("translating...")
      view.finished()
      expect(view.statusBar.innerHTML).toBe("")
    })
  })
})
