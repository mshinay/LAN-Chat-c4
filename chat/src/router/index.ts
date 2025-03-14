import { createRouter, createWebHistory } from "vue-router"
import Chat from "@/views/chat/index.vue"
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/chat"
        },
        {
            path: "/chat",
            name: "chat",
            component: Chat,
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/chat'
        }
    ]
})

export default router