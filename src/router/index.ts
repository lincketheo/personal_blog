import {createRouter, createWebHistory} from 'vue-router'
import HomeIndex from '@/home/HomeIndex.vue'
import { meta } from "@/meta"
import {postToVueRoute, topicToVueRoute} from "@/models";
import AboutIndex from "@/about/AboutIndex.vue";

const routes = [
    {
        path: '/',
        component: HomeIndex,
        name: "home"
    },
    {
        path: '/about',
        component: AboutIndex,
        name: "about",
    },
    ...(meta.blog.posts.map(it => postToVueRoute(it, meta.blog))),
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
})

export default router
