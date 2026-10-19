import { WindowToggleMaximise } from "/wailsjs/runtime/runtime";

export function toggleFromWindowHeader(event) {
  if (event.defaultPrevented || event.target.closest("button, a, input, select, textarea")) return;
  WindowToggleMaximise();
}

export default function WindowHeader() {
  return <div className="editor-window-drag" aria-hidden="true"
    style={{ "--wails-draggable": "drag" }} onDoubleClick={toggleFromWindowHeader} />;
}
