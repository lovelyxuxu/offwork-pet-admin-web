import { defineStore } from 'pinia'

export const useAuth = defineStore('auth', {
  state: () => ({ loggedIn: false, checked: false, username: '' }),
  actions: {
    setLoggedIn(value) {
      this.loggedIn = value
      this.checked = true
    },
  },
})