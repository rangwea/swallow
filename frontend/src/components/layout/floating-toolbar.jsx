import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { t } from "@/lib/i18n";

const edges = ["top", "right", "bottom", "left"];
const defaultStorageKey = "editor-toolbar-dock";
export function readToolbarDock(storageKey = defaultStorageKey) {
  try {
    const edge = localStorage.getItem(storageKey);
    return edges.includes(edge) ? edge : "top";
  } catch { return "top"; }
}

export default function FloatingToolbar({ edge, onDock, children, storageKey = defaultStorageKey, label = t("editorMode") }) {
  const toolbar = useRef(null);
  const gesture = useRef(null);
  const [position, setPosition] = useState(null);

  function dock(nextEdge) {
    onDock(nextEdge);
    try { localStorage.setItem(storageKey, nextEdge); } catch { /* Storage can be unavailable. */ }
    setPosition(null);
  }

  function start(event) {
    if (event.button !== 0) return;
    const rect = toolbar.current.getBoundingClientRect();
    gesture.current = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPosition({ left: rect.left, top: rect.top });
    event.preventDefault();
  }

  function move(event) {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = toolbar.current.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(innerWidth - rect.width - 8, event.clientX - drag.x)),
      top: Math.max(44, Math.min(innerHeight - rect.height - 8, event.clientY - drag.y)),
    });
  }

  function end(event) {
    if (!gesture.current || gesture.current.pointerId !== event.pointerId) return;
    gesture.current = null;
    const distances = { top: Math.abs(event.clientY - 44), right: Math.abs(innerWidth - event.clientX), bottom: Math.abs(innerHeight - event.clientY), left: Math.abs(event.clientX) };
    dock(edges.reduce((nearest, item) => distances[item] < distances[nearest] ? item : nearest, "top"));
  }

  function cancel() { gesture.current = null; setPosition(null); }

  return <div ref={toolbar} className={`editor-floating-toolbar editor-toolbar-${edge}${position ? " is-dragging" : ""}`}
    data-dock={edge} style={position ? { left: position.left, top: position.top, right: "auto", bottom: "auto", transform: "none" } : undefined}
    role="toolbar" aria-label={label}>
    <button type="button" className="editor-toolbar-grip" aria-label={t("editorDragToolbar")}
      title={t("editorDragToolbar")} onPointerDown={start} onPointerMove={move}
      onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onKeyDown={(event) => {
        const next = { ArrowUp: "top", ArrowRight: "right", ArrowDown: "bottom", ArrowLeft: "left" }[event.key];
        if (next) { event.preventDefault(); dock(next); }
        if (event.key === "Escape") cancel();
      }}>
      <GripVertical size={16} />
    </button>
    {children}
  </div>;
}
