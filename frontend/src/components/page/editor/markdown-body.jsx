import { forwardRef, lazy, memo, Suspense, useEffect, useImperativeHandle, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { previewRemarkPlugins } from "./preview-breaks";
import { previewElements, previewPlugins, previewUrl } from "./preview-html";

// Load Markdown parsing and code highlighting only when preview is requested.
const Markdown = lazy(() => import("@uiw/react-md-editor").then((module) => ({ default: module.default.Markdown })));
const Preview = memo(function Preview({ source }) {
  return <Suspense fallback={<p role="status">{t("editorLoading")}</p>}>
    <Markdown source={source} skipHtml={false} allowedElements={previewElements} remarkPlugins={previewRemarkPlugins} rehypePlugins={previewPlugins} urlTransform={previewUrl} />
  </Suspense>;
});

const MarkdownBody = forwardRef(function MarkdownBody({ mode, disabled, onDirty, onImage, onComposition }, ref) {
  const textarea = useRef(null);
  const timer = useRef(null);
  const composing = useRef(false);
  const [colorMode, setColorMode] = useState(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [source, setSource] = useState("");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  function schedulePreview() {
    clearTimeout(timer.current);
    if (modeRef.current === "edit" || composing.current) return;
    timer.current = setTimeout(() => setSource(textarea.current.value), 180);
  }

  useEffect(() => {
    clearTimeout(timer.current);
    if (mode !== "edit") setSource(textarea.current.value);
    else textarea.current.focus();
  }, [mode]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const observer = new MutationObserver(() => setColorMode(document.documentElement.classList.contains("dark") ? "dark" : "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => textarea.current.value,
    setValue(value) {
      textarea.current.value = value;
      setSource(value);
    },
    getSelection() {
      const input = textarea.current;
      return { start: input.selectionStart, end: input.selectionEnd, text: input.value.slice(input.selectionStart, input.selectionEnd), value: input.value, composing: composing.current };
    },
    focus() { textarea.current.focus(); },
    restoreSelection(selection) {
      const input = textarea.current;
      input.focus();
      if (selection && input.value === selection.value) input.setSelectionRange(selection.start, selection.end);
    },
    insert(text, selection) {
      const input = textarea.current;
      if (selection && input.value !== selection.value) return false;
      input.setRangeText(text, selection?.start ?? input.selectionStart, selection?.end ?? input.selectionEnd, "end");
      onDirty();
      schedulePreview();
      requestAnimationFrame(() => input.focus());
      return true;
    },
  }));

  function transferImage(event, transfer) {
    const image = Array.from(transfer.files || []).find((file) => file.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault();
    onImage(image);
  }

  return <div className={`markdown-body markdown-body-${mode}`}>
    <textarea ref={textarea} className="markdown-source" hidden={mode === "preview"}
      disabled={disabled} aria-label={t("editorEdit")} placeholder={t("contentPlaceholder")}
      spellCheck={false} autoCapitalize="off" autoCorrect="off"
      onChange={() => { onDirty(); schedulePreview(); }}
      onCompositionStart={() => { composing.current = true; onComposition?.(true); clearTimeout(timer.current); }}
      onCompositionEnd={() => { composing.current = false; onComposition?.(false); schedulePreview(); }}
      onPaste={(event) => transferImage(event, event.clipboardData)}
      onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
      onDrop={(event) => {
        if (event.dataTransfer.files.length) event.preventDefault();
        transferImage(event, event.dataTransfer);
      }} />
    {mode !== "edit" && <div className="markdown-preview" data-color-mode={colorMode} tabIndex={0} aria-label={t("preview")}>
      <Preview source={source} />
    </div>}
  </div>;
});

export default memo(MarkdownBody);
