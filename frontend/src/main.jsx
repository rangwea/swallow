import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createHashRouter, RouterProvider } from "react-router-dom";
import Home from '@/components/page/home.jsx'
import SettingsPage from "@/components/page/settings/page.jsx"
import EditorPage from '@/components/page/editor/page.jsx'
import Example from "@/components/page/test.jsx"
import { initializeTheme } from '@/lib/themes'
import { initializeLanguage } from '@/lib/i18n'
import { ConfGet } from "/wailsjs/go/backend/App"
import { applyEditorFonts, loadGoogleFonts, getRequiredFonts } from '@/lib/fonts'

// Initialize theme and language on app load
initializeTheme();
initializeLanguage();

// Initialize editor fonts
ConfGet("app").then((result) => {
  if (result.code === 0 && result.data) {
    const { editorTitleFont, editorContentFont, editorLineHeight, editorFontSize } = result.data;
    if (editorTitleFont || editorContentFont) {
      applyEditorFonts({
        titleFont: editorTitleFont || "playfair-display",
        contentFont: editorContentFont || "instrument-sans",
        lineHeight: editorLineHeight || 1.75,
        fontSize: editorFontSize || 16,
      });
      // Load required fonts
      const fonts = getRequiredFonts(
        editorTitleFont || "playfair-display",
        editorContentFont || "instrument-sans"
      );
      loadGoogleFonts(fonts);
    }
  }
});

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
