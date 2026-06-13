import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { PostDetail } from "./pages/PostDetail";
import { Editor } from "./pages/Editor";

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
  }
]);