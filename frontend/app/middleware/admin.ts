export default defineNuxtRouteMiddleware(async () => {
    const { $parse } = useNuxtApp();
    const currentUser = $parse.User.current();
    if (!currentUser) return navigateTo("/login");

    try {
        // Vérification du rôle admin en frontend pur avec Parse SDK
        const roleQuery = new $parse.Query($parse.Role);
        roleQuery.equalTo("name", "admin");
        const adminRole = await roleQuery.first({ useMasterKey: true });

        if (!adminRole) return navigateTo("/");

        const relation = adminRole.get("users");
        const userInRole = await relation
            .query()
            .equalTo("objectId", currentUser.id)
            .first({ useMasterKey: true });

        if (!userInRole) return navigateTo("/");
    } catch {
        return navigateTo("/");
    }
});
