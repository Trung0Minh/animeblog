import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { PostDetail } from "./pages/PostDetail";
import { Editor } from "./pages/Editor";
import { AdminRoot } from "./AdminRoot";
import { Dashboard } from "./pages/admin/Dashboard";
import { Posts } from "./pages/admin/Posts";
import { Writers } from "./pages/admin/Writers";
import { Comments } from "./pages/admin/Comments";
import { Newsletter } from "./pages/admin/Newsletter";
import { Analytics } from "./pages/admin/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "post/:id", Component: PostDetail },
    ],
  },
  {
    path: "/editor",
    Component: Editor,
  },
  {
    path: "/admin",
    Component: AdminRoot,
    children: [
      { index: true, Component: Dashboard },
      { path: "posts", Component: Posts },
      { path: "writers", Component: Writers },
      { path: "comments", Component: Comments },
      { path: "newsletter", Component: Newsletter },
      { path: "analytics", Component: Analytics },
    ]
  }
]);