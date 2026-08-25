import type { RouteRecordRaw } from "vue-router";

export interface MetaInformation {
  blog: { posts: Post[] };
}

export interface Post {
  title: string;
  date: Date;
  entry: any;
  route: string;
  description: string;
  name: string;
}

export function postToVueRoute(post: Post): RouteRecordRaw {
  return {
    path: post.route,
    component: post.entry,
    name: post.name,
  };
}
