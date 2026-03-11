export default defineNuxtRouteMiddleware(async () => {
  const { $parse } = useNuxtApp()
  const currentUser = $parse.User.current()
  if (!currentUser) return navigateTo('/login')

  try {
    const isAdmin = await $parse.Cloud.run('checkAdminRole')
    if (!isAdmin) return navigateTo('/')
  } catch {
    return navigateTo('/')
  }
})
