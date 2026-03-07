export default defineNuxtRouteMiddleware((to) => {
  const { $parse } = useNuxtApp()
  const currentUser = $parse.User.current()

  if (!currentUser && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (currentUser && to.path === '/login') {
    return navigateTo('/')
  }
})
