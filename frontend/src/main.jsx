import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createHashRouter, RouterProvider } from "react-router-dom";
import Home from '@/components/page/home.jsx'
import SettingsPage from "@/components/page/settings/page.jsx"
import EditorPage from "@/components/page/editor/page.jsx"
import Example from "@/components/page/test.jsx"

const router = createHashRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/test",
    element: <Example />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/editor",
    element: <EditorPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </React.StrictMode>
);
