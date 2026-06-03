export default defineNuxtRouteMiddleware((to) => {
    const { $parse } = useNuxtApp();
    const currentUser = $parse.User.current();

    const publicRoutes = [
        "/login",
        "/services",
        "/espace",
        "/redirect-pdf",
        "/redirect-espace",
    ];
    const isPublicRoute = publicRoutes.some((route) =>
        to.path.startsWith(route),
    );

    if (!currentUser && !isPublicRoute) {
        return navigateTo("/login");
    }

    if (currentUser && to.path === "/login") {
        return navigateTo("/");
    }
});
