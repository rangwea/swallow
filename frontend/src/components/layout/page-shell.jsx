import { useState } from "react";
import FloatingToolbar, { readToolbarDock } from "./floating-toolbar";
import WindowHeader from "./window-header";

export default function PageShell({ name, label, toolbar, children }) {
  const storageKey = `${name}-toolbar-dock`;
  const [dock, setDock] = useState(() => readToolbarDock(storageKey));
  return <div className="editor-shell app-page-shell flex flex-col h-screen overflow-hidden" data-dock={dock}>
    <WindowHeader />
    <FloatingToolbar edge={dock} onDock={setDock} storageKey={storageKey} label={label}>
      {toolbar}
    </FloatingToolbar>
    {children}
  </div>;
}
