import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolButton from "@/components/layout/tool-button";
import { t } from "@/lib/i18n";

const colors = ["#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0284c7", "#7c3aed", "#db2777", "#64748b"];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function InsertTools({ bodyRef, disabled, onInserted }) {
  const [tool, setTool] = useState(null);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("https://");
  const [color, setColor] = useState(colors[0]);
  const selection = useRef(null);
  const inserted = useRef(false);

  function open(kind) {
    const snapshot = bodyRef.current?.getSelection();
    if (!snapshot || snapshot.composing) return;
    if (kind === "color" && !snapshot.text) { toast.info(t("editorSelectText")); return; }
    selection.current = snapshot;
    inserted.current = false;
    setLabel(snapshot.text);
    setUrl("https://");
    setRows(3); setColumns(3);
    setTool(kind);
  }

  function submit(event) {
    event.preventDefault();
    const snapshot = selection.current;
    let text;
    if (tool === "table") {
      const rowCount = Number(rows), columnCount = Number(columns);
      if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > 20 || !Number.isInteger(columnCount) || columnCount < 1 || columnCount > 12) return;
      const header = Array.from({ length: columnCount }, (_, i) => `${t("editorTableHeader")} ${i + 1}`);
      const line = (cells) => `| ${cells.join(" | ")} |`;
      const table = [line(header), line(header.map(() => "---")), ...Array.from({ length: rowCount }, () => line(header.map(() => " ")))].join("\n");
      text = `${snapshot.start && snapshot.value[snapshot.start - 1] !== "\n" ? "\n\n" : "\n"}${table}\n\n`;
    } else if (tool === "link") {
      const address = url.trim();
      if (!label.trim() || !address || /[\u0000-\u0020]/.test(address) || (/^[a-z][a-z\d+.-]*:/i.test(address) && !/^(https?:|mailto:|tel:)/i.test(address)) || address === "https://" || address === "http://") {
        toast.error(t("editorInvalidLink")); return;
      }
      const title = label.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\r?\n/g, " ");
      const destination = address.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/</g, "%3C").replace(/>/g, "%3E");
      text = `[${title}](${destination})`;
    } else {
      if (!/^#[\da-f]{6}$/i.test(color)) return;
      text = `<span style="color: ${color}">${escapeHtml(snapshot.text)}</span>`;
    }
    if (!bodyRef.current?.insert(text, snapshot)) { toast.error(t("editorSelectionChanged")); setTool(null); return; }
    inserted.current = true;
    onInserted();
    setTool(null);
  }

  const title = t(tool === "table" ? "editorInsertTable" : tool === "link" ? "editorInsertLink" : "editorTextColor");
  return <>
    <ToolButton icon="Table2" label={t("editorInsertTable")} disabled={disabled} onClick={() => open("table")} />
    <ToolButton icon="Link" label={t("editorInsertLink")} disabled={disabled} onClick={() => open("link")} />
    <ToolButton icon="Palette" label={t("editorTextColor")} disabled={disabled} onClick={() => open("color")} />
    <Dialog.Root open={Boolean(tool)} onOpenChange={(open) => { if (!open) setTool(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="editor-insert-overlay" />
        <Dialog.Content className="editor-insert-dialog" onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (inserted.current) bodyRef.current?.focus();
          else bodyRef.current?.restoreSelection(selection.current);
        }}>
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1">{t(tool === "color" ? "editorColorHint" : "editorInsertHint")}</Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {tool === "table" && <div className="grid grid-cols-2 gap-4">
              <label className="editor-insert-field">{t("editorTableColumns")}<Input type="number" required min={1} max={12} value={columns} onChange={(e) => setColumns(e.target.value)} /></label>
              <label className="editor-insert-field">{t("editorTableRows")}<Input type="number" required min={1} max={20} value={rows} onChange={(e) => setRows(e.target.value)} /></label>
            </div>}
            {tool === "link" && <>
              <label className="editor-insert-field">{t("editorLinkText")}<Input required value={label} onChange={(e) => setLabel(e.target.value)} /></label>
              <label className="editor-insert-field">{t("editorLinkUrl")}<Input required value={url} placeholder="https://example.com" onChange={(e) => setUrl(e.target.value)} /></label>
            </>}
            {tool === "color" && <>
              <p className="truncate rounded-lg bg-secondary/50 p-3 text-sm" style={{ color }} title={selection.current?.text}>{selection.current?.text}</p>
              <div className="flex flex-wrap gap-2">{colors.map((value) => <button type="button" key={value} className="editor-color-swatch" style={{ background: value }} aria-label={value} aria-pressed={color === value} onClick={() => setColor(value)} />)}</div>
              <label className="editor-insert-field">{t("editorCustomColor")}<input className="editor-color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
            </>}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild><Button type="button" variant="ghost">{t("cancel")}</Button></Dialog.Close>
              <Button type="submit" variant="secondary">{t("editorInsert")}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
