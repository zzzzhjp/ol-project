import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            name: "Home",
            component: () => import("@/views/Home.vue")
        },
        {
            path: "/screen",
            name: "Screen",
            component: () => import("@/views/Screen.vue")
        }
    ]
})

export default router;