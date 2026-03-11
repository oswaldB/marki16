export default defineNuxtRouteMiddleware((to) => {
  const { $parse } = useNuxtApp()
  const currentUser = $parse.User.current()

  const publicRoutes = ['/login', '/services']
  if (!currentUser && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (currentUser && to.path === '/login') {
    return navigateTo('/')
  }
})
