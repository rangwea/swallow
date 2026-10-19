import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import MarkdownBody from "./markdown-body";
import InsertTools from "./insert-tools";
import FloatingToolbar, { readToolbarDock } from "@/components/layout/floating-toolbar";
import { toast } from "sonner";
import WindowHeader from "@/components/layout/window-header";
import ToolBtn from "@/components/layout/tool-button";
import {
  ArticleSave,
  ArticleGet,
  ArticleInsertImage,
  ArticleInsertImageBlob,
} from "/wailsjs/go/backend/App";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { TagInput } from "emblor";
import { getCurrentTime, isSuccess } from "@/components/page/util";
import { t } from "@/lib/i18n";

function EditorPage() {
  const [params] = useSearchParams();
  const requestedId = params.get("id");
  const [id, setId] = useState(requestedId);

  const [title, setTitle] = useState("");
  const bodyRef = useRef(null);
  const revision = useRef(0);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [dock, setDock] = useState(readToolbarDock);
  const [preview, setPreview] = useState("edit");
  const [changed, setChanged] = useState(false);
  const markChanged = useCallback(() => {
    revision.current += 1;
    setChanged(true);
  }, []);

  const form = useForm();

  const [tags, setTags] = React.useState([]);
  const [activeTagIndex, setActiveTagIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setId(requestedId);
    setLoading(Boolean(requestedId));
    setLoadFailed(false);
    setChanged(false);
    setTitle("");
    setTags([]);
    form.reset({ tags: [], date: getCurrentTime(), lastmod: getCurrentTime() });
    bodyRef.current?.setValue("");
    if (requestedId) {
      ArticleGet(requestedId).then((result) => {
        if (cancelled) return;
        if (!isSuccess(result)) {
          setLoadFailed(true);
          return;
        }
        const meta = result.data.meta;
        const loadedTags = (meta.tags || []).map((text) => ({ id: text, text }));
        setTitle(meta.title || "");
        bodyRef.current?.setValue(result.data.content || "");
        setTags(loadedTags);
        form.reset({ tags: loadedTags, date: meta.date || "", lastmod: meta.lastmod || "" });
      }).catch(() => {
        if (!cancelled) { setLoadFailed(true); toast.error(t("editorLoadFailed")); }
      }).finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [requestedId, form]);

  async function save() {
    if (savingRef.current || loading || loadFailed) return;
    savingRef.current = true;
    setSaving(true);
    const savedRevision = revision.current;
    try {
      const r = await ArticleSave(id || "", getMeta(), bodyRef.current?.getValue() || "");
      if (isSuccess(r)) {
        setId(r.data);
        if (revision.current === savedRevision) setChanged(false);
      }
    } catch {
      toast.error(t("editorSaveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function getMeta() {
    let meta = { ...form.getValues() };
    meta["title"] = title;
    if (meta["tags"]) {
      meta["tags"] = meta["tags"].map((e) => e.text);
    }
    return meta;
  }

  async function insertImage() {
    try {
      const r = await ArticleInsertImage(id || "");
      if (isSuccess(r)) insertImageText(r.data);
    } catch {
      toast.error(t("editorImageFailed"));
    }
  }

  function insertImageText(path) {
    setPreview((mode) => mode === "preview" ? "edit" : mode);
    bodyRef.current?.insert(`![](${path})\n`);
  }

  async function onImagePasted(file) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const r = await ArticleInsertImageBlob(id || "", `[${bytes.toString()}]`);
      if (isSuccess(r)) insertImageText(r.data);
    } catch {
      toast.error(t("editorImageFailed"));
    }
  }

  function titleChange(e) {
    markChanged();
    setTitle(e.target.value);
  }

  const statusText = t(loadFailed ? "editorLoadFailed" : loading ? "editorLoading" : saving ? "editorSaving" : changed ? "editorUnsaved" : "editorSaved");

  return (
    <Sheet key="right">
      <div className="editor-shell flex flex-col h-screen overflow-hidden" data-dock={dock}>
        <WindowHeader />
        <FloatingToolbar edge={dock} onDock={setDock}>
          <Link to="/">
            <Button
              aria-label={t("editorBack")}
              variant="ghost"
              size="icon"
              className="w-10 h-10 hover:bg-accent/20 hover:scale-110 transition-all duration-300 rounded-full"
            >
              <MoveLeft size="20" className="text-foreground/70" strokeWidth={1.75} />
            </Button>
          </Link>
          <div className="editor-mode-switch" role="group" aria-label={t("editorMode")}>
            {["edit", "live", "preview"].map((mode) => (
              <Button key={mode} variant={preview === mode ? "secondary" : "ghost"}
                size="sm" aria-pressed={preview === mode} onClick={() => setPreview(mode)}>
                {t(mode === "live" ? "editorSplit" : mode === "edit" ? "editorEdit" : "preview")}
              </Button>
            ))}
          </div>
          <span className="editor-save-status text-xs text-muted-foreground" role="status" title={statusText}>
            {statusText}
          </span>
          <InsertTools bodyRef={bodyRef} disabled={loading || loadFailed || preview === "preview"} onInserted={() => setPreview((mode) => mode === "preview" ? "edit" : mode)} />
          <ToolBtn icon="Image" label={t("editorInsertImage")} onClick={insertImage} disabled={loading || loadFailed} />
          <SheetTrigger asChild><ToolBtn icon="Settings" label={t("articleMeta")} /></SheetTrigger>
          <Button
            aria-label={t("editorSave")}
            title={t("editorSave") + " (⌘/Ctrl+S)"}
            disabled={saving || loading || loadFailed}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full"
            onClick={save}
          >
            <Check
              size="20"
              className={changed ? "text-accent" : "text-foreground/70"}
              strokeWidth={2}
            />
          </Button>
        </FloatingToolbar>
        <div className={`editor-workspace editor-workspace-${preview}`}>
          <input
            className="editor-title-input"
            aria-label={t("titlePlaceholder")}
            placeholder={t("titlePlaceholder")}
            value={title}
            disabled={loading || loadFailed}
            onChange={titleChange}
          />
          <MarkdownBody ref={bodyRef} mode={preview} disabled={loading || loadFailed}
            onDirty={markChanged} onImage={onImagePasted} />
        </div>

        <SheetContent className="backdrop-blur-md bg-card/95">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">{t("articleMeta")}</SheetTitle>
          </SheetHeader>
          <Separator className="my-6 bg-border/50" />
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">{t("tags")}</FormLabel>
                    <FormControl>
                      <TagInput
                        {...field}
                        tags={tags}
                        placeholder={t("tagsPlaceholder")}
                        setTags={(newTags) => {
                          setTags(newTags);
                          form.setValue("tags", newTags);
                          markChanged();
                        }}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                        size={"md"}
                        animation={"fadeIn"}
                        styleClasses={{
                          input: "border-0 shadow-none focus-visible:ring-0 bg-transparent",
                          inlineTagsContainer: "pl-1 min-h-11 bg-background/50",
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              ></FormField>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">{t("date")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("createTime")}
                        {...field}
                        onChange={(event) => { field.onChange(event); markChanged(); }}
                        className="h-11 bg-background/50"
                      />
                    </FormControl>
                  </FormItem>
                )}
              ></FormField>
              <FormField
                control={form.control}
                name="lastmod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">{t("lastmod")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("updateTime")}
                        {...field}
                        onChange={(event) => { field.onChange(event); markChanged(); }}
                        className="h-11 bg-background/50"
                      />
                    </FormControl>
                  </FormItem>
                )}
              ></FormField>
            </form>
          </Form>
        </SheetContent>
      </div>
    </Sheet>
  );
}

export default EditorPage;
