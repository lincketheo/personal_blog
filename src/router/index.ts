import { createRouter, createWebHistory } from "vue-router";
import HomeIndex from "@/home/HomeIndex.vue";
import { meta } from "@/meta";
import { postToVueRoute } from "@/models";
import AboutIndex from "@/about/AboutIndex.vue";
import ProgramsIndex from "@/programs/ProgramsIndex.vue";

const routes = [
  {
    path: "/",
    component: HomeIndex,
    name: "home",
  },
  {
    path: "/about",
    component: AboutIndex,
    name: "about",
  },
  {
    path: "/programs",
    component: ProgramsIndex,
    name: "programs",
  },
  ...meta.blog.posts.map(postToVueRoute),
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
