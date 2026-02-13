import React, { useEffect, useState, forwardRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { icons, Check, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import {
  ArticleSave,
  ArticleGet,
  ArticleInsertImage,
  ArticleInsertImageBlob,
} from "/wailsjs/go/backend/App";
import "../style.css";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Toaster } from "@/components/ui/sonner";
import { getCurrentTime, isSuccess } from "@/components/page/util";

function EditorPage() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id"));

  // article vars
  const [title, setTitle] = useState(); // title
  const [content, setContent] = useState(""); // content

  // preview button vars
  const [preview, setPreview] = useState("edit");
  const [previewIcon, setPreviewIcon] = useState("Eye");

  const mdTextAreaId = "mdTextArea";

  const [changed, setChanged] = useState(false);

  const form = useForm();

  const [tags, setTags] = React.useState([]);
  const [activeTagIndex, setActiveTagIndex] = useState(null);

  useEffect(() => {
    init();
  }, []);

  function init() {
    if (id) {
      // existed id，edit
      ArticleGet(id).then((result) => {
        if (!isSuccess(result)) {
          return;
        }
        let meta = result.data.meta;
        setTitle(meta.title);
        setContent(result.data.content);
        if (meta.tags) {
          form.setValue(
            "tags",
            meta.tags.map((e) => ({
              text: e
            }))
          );
        }
        form.setValue("date", meta.date);
        form.setValue("lastmod", meta.lastmod);
      });
    } else {
      let curDate = getCurrentTime();
      form.setValue("date", curDate);
      form.setValue("lastmod", curDate);
    }
  }

  function save(e) {
    let meta = getMeta();
    ArticleSave(id, meta, content).then((r) => {
      if (isSuccess(r)) {
        setId(r.data);
        setChanged(false);
      }
    });
  }

  function getMeta() {
    let meta = form.getValues();
    meta["title"] = title;
    if (meta["tags"]) {
      meta["tags"] = meta["tags"].map((e) => e.text);
    }
    return meta;
  }

  function insertImage() {
    ArticleInsertImage(id).then((r) => {
      insertImageTextToArea(r);
    });
  }

  function insertImageTextToArea(r) {
    if (isSuccess(r)) {
      const md = insertToTextArea(`![](${r.data})\n`);
      setContent(md);
    }
  }

  function contentChange(c) {
    setChanged(true);
    setContent(c);
  }

  function previewToggle() {
    if (preview === "edit") {
      setPreview("preview");
      setPreviewIcon("FilePenLine");
    } else {
      setPreview("edit");
      setPreviewIcon("Eye");
    }
  }

  function insertToTextArea(insertString) {
    const textarea = document.getElementById(mdTextAreaId);
    if (!textarea) {
      return null;
    }

    let sentence = textarea.value;
    const len = sentence.length;
    const pos = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const front = sentence.slice(0, pos);
    const back = sentence.slice(pos, len);

    sentence = front + insertString + back;

    textarea.value = sentence;
    textarea.selectionEnd = end + insertString.length;

    return sentence;
  }

  function onImagePasted(dataTransfer) {
    const file = dataTransfer.files.item(0);
    Promise.resolve(file.arrayBuffer()).then((ab) => {
      const u = new Uint8Array(ab);
      ArticleInsertImageBlob(id, `[${u.toString()}]`).then((r) => {
        insertImageTextToArea(r);
      });
    });
  }

  function titleChange(e) {
    setChanged(true);
    setTitle(e.target.value);
  }

  function metaChange() {
    setChanged(true);
  }

  const ToolBtn = forwardRef((props, ref) => {
    const {icon, onClick} = props
    const LucideIcon = icons[icon];
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-accent/20 hover:scale-110 transition-all duration-300 hover:shadow-md rounded-full backdrop-blur-sm bg-card/50 border border-border/30"
        onClick={onClick}
      >
        <LucideIcon size="20" className="text-foreground/70" strokeWidth={1.75} />
      </Button>
    );
  });

  return (
    <Sheet key="right">
      <div className="flex flex-col h-screen">
        <Toaster position="top-center" />
        <div
          className="flex justify-end w-full gap-2 border-b border-border/50 pr-6 py-3 backdrop-blur-sm bg-card/80"
          style={{ "--wails-draggable": "drag" }}
        >
          <Link to="/">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 hover:bg-accent/20 hover:scale-110 transition-all duration-300 rounded-full"
            >
              <MoveLeft size="20" className="text-foreground/70" strokeWidth={1.75} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 hover:scale-110 transition-all duration-300 rounded-full"
            onClick={save}
          >
            <Check
              size="20"
              className={changed ? "text-accent" : "text-foreground/70"}
              strokeWidth={2}
            />
          </Button>
        </div>
        <div className="flex justify-center items-center relative">
          <div className="flex flex-col w-3/5 animate-slide-up">
            <input
              className="border-0 border-none shadow-none ring-0 focus:ring-0 h-14 text-3xl py-2 px-3 editor-title-input font-serif bg-transparent placeholder:text-muted-foreground/30 text-foreground/90"
              placeholder="Your story title..."
              value={title}
              onChange={titleChange}
            ></input>
            <MDEditor
              value={content}
              onChange={contentChange}
              onPaste={(e) => {
                if (e.clipboardData.files.length > 0) {
                  e.preventDefault();
                  onImagePasted(e.clipboardData);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                onImagePasted(e.dataTransfer);
              }}
              style={{
                marginTop: 8,
                marginBottom: 10,
                border: "none",
              }}
              hideToolbar={true}
              height="calc(100vh - 120px)"
              preview={preview}
              textareaProps={{
                id: mdTextAreaId,
                placeholder: "Write your story...",
              }}
            />
          </div>
          <div className="fixed top-1/2 right-4 transform -translate-y-1/2 h-auto flex flex-col gap-3">
            <ToolBtn icon="Image" onClick={insertImage}></ToolBtn>
            <ToolBtn icon={previewIcon} onClick={previewToggle}></ToolBtn>
            <SheetTrigger asChild>
              <ToolBtn icon="Settings"></ToolBtn>
            </SheetTrigger>
          </div>
        </div>

        <SheetContent className="backdrop-blur-md bg-card/95">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Article Meta</SheetTitle>
          </SheetHeader>
          <Separator className="my-6 bg-border/50" />
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        {...field}
                        tags={tags}
                        placeholder="Enter a tag"
                        setTags={(newTags) => {
                          setTags(newTags);
                          form.setValue("tags", newTags);
                        }}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                        size={"md"}
                        animation={"fadeIn"}
                        styleClasses={{
                          input: "h-11 bg-background/50",
                          inlineTagsContainer: "pl-1",
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
                    <FormLabel className="text-base font-medium">Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Create time"
                        {...field}
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
                    <FormLabel className="text-base font-medium">Lastmod</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Last modify time"
                        {...field}
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
