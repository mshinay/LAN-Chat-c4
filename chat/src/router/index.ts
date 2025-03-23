import { createRouter, createWebHistory } from "vue-router"
import Login from "@/views/chat/login.vue" // 引入登录页面
import Chat from "@/views/chat/index.vue"
import { useUserStore } from "@/stores/user";
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/login",
        },
        {
            path: "/login",
            name: "login",
            component: () => import("@/views/chat/login.vue"),
            meta: { title: "登录 - LAN-Chat" },
        },
        {
            path: "/chat",
            name: "chat",
            component: Chat,
            meta: { title: "聊天 - LAN-Chat" },
        },
    ]
    
})

router.beforeEach((to, from, next) => {
    const walletAddress = localStorage.getItem("walletAddress");
    const userStore = useUserStore()
    if (to.path === "/chat" && !walletAddress) {
        console.log("未登录，重定向到登录页面");
        next("/login");
    } else {
        console.log(userStore.walletAddress+"已登录，允许进入聊天页面");
        
        next(); // 继续导航
    }
});


// 监听路由变化，动态设置标题
router.afterEach((to) => {
    
    document.title = to.meta.title || "LAN-Chat";
});

export default router