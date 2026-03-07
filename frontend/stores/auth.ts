import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { $parse } = useNuxtApp()
  const user = ref<any>(null)

  const fetchCurrentUser = () => {
    user.value = $parse.User.current()
  }

  const login = async (username: string, password: string) => {
    const loggedUser = await $parse.User.logIn(username, password)
    user.value = loggedUser
    return loggedUser
  }

  const logout = async () => {
    await $parse.User.logOut()
    user.value = null
    await navigateTo('/login')
  }

  return { user, fetchCurrentUser, login, logout }
})
