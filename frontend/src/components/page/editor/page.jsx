import React, { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import MarkdownBody from "./markdown-body";
import WritingDialog from "./writing-dialog";
import useWritingDraft from "./use-writing-draft";
import { wt } from "@/lib/writing-text";
import InsertTools from "./insert-tools";
import FloatingToolbar, { readToolbarDock } from "@/components/layout/floating-toolbar";
import { toast } from "sonner";
import WindowHeader from "@/components/layout/window-header";
import ToolBtn from "@/components/layout/tool-button";
import {
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
import { isSuccess } from "@/components/page/util";
import { t } from "@/lib/i18n";

function EditorPage() {
  const [params] = useSearchParams();
  const requestedId = params.get("id");
  const [title,setTitle]=useState("");
  const bodyRef=useRef(null);
  const form=useForm();
  const [tags,setTags]=useState([]);
  const [activeTagIndex,setActiveTagIndex]=useState(null);
  const [dock,setDock]=useState(readToolbarDock);
  const [preview,setPreview]=useState("edit");
  const writing=useWritingDraft({requestedId,requestedDraft:params.get("draft"),bodyRef,form,title,setTitle,setTags});
  const {id,loading,loadFailed,saving,changed,markChanged,save}=writing;
  const locked=loading||loadFailed||!!writing.recovery||writing.leaving||!!writing.leave;

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

  const statusText = loadFailed?t("editorLoadFailed"):loading?t("editorLoading"):saving?t("editorSaving"):writing.draftStatus?wt(writing.draftStatus):(changed||!id)?t("editorUnsaved"):wt("formalSaved");

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
            {writing.draftStatus==="draftFailed"?<button type="button" aria-label={wt("retry")} onClick={writing.retry}>{statusText}</button>:statusText}
          </span>
          <InsertTools bodyRef={bodyRef} disabled={locked || preview === "preview"} onInserted={() => setPreview((mode) => mode === "preview" ? "edit" : mode)} />
          <ToolBtn icon="Image" label={t("editorInsertImage")} onClick={insertImage} disabled={locked} />
          <SheetTrigger asChild><ToolBtn icon="Settings" label={t("articleMeta")} disabled={locked} /></SheetTrigger>
          <Button
            aria-label={t("editorSave")}
            title={t("editorSave") + " (⌘/Ctrl+S)"}
            disabled={saving || locked}
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
            disabled={locked}
            onChange={titleChange}
          />
          <MarkdownBody ref={bodyRef} mode={preview} disabled={locked}
            onDirty={markChanged} onImage={onImagePasted} onComposition={writing.onComposition} />
        </div>

        {writing.recovery&&<WritingDialog label={wt("recovery")}><h2>{wt("recovery")}</h2><p>{wt(writing.recovery.conflict?"conflict":"recoveryHint")}</p><div className="flex gap-2 flex-wrap"><Button onClick={()=>writing.decideRecovery("recover")}>{wt("recover")}</Button><Button variant="secondary" onClick={()=>writing.decideRecovery("later")}>{wt("later")}</Button><Button variant="ghost" onClick={()=>{if(window.confirm(wt("discardConfirm")))writing.decideRecovery("discard");}}>{wt("discard")}</Button></div></WritingDialog>}
        {writing.leave&&<WritingDialog alert label={wt("draftFailed")}><h2>{wt("draftFailed")}</h2><p>{wt("leaveFailed")}</p><div className="flex gap-2 flex-wrap">{["retry","stay","abandon"].map(action=><Button key={action} variant={action==="retry"?"default":"ghost"} onClick={()=>writing.leaveAction(action)}>{wt(action)}</Button>)}</div></WritingDialog>}
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
