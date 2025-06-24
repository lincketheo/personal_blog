import {createRouter, createWebHistory} from 'vue-router'
import HomeIndex from '@/home/HomeIndex.vue'
import { meta } from "@/meta"
import {postToVueRoute, topicToVueRoute} from "@/models";

/**
 * All the meta information about the blog
 * TODO - add typing
 */

const routes = [
    {
        path: '/',
        component: HomeIndex,
        name: "home"
    },
    topicToVueRoute(meta.blog),
    ...(meta.blog.posts.map(it => postToVueRoute(it, meta.blog))),
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
})

export default router
