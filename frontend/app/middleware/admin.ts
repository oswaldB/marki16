export default defineNuxtRouteMiddleware(async () => {
    const { $parse } = useNuxtApp();
    const currentUser = $parse.User.current();
    if (!currentUser) return navigateTo("/login");

    try {
        const result = await $parse.Cloud.run("checkAdmin");
        if (!result?.isAdmin) return navigateTo("/");
    } catch {
        return navigateTo("/");
    }
});
