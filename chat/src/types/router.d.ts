import "vue-router";

declare module "vue-router" {
    interface RouteMeta {
        title?: string; // 页面标题（可选）
    }
}
