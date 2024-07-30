import React, { useEffect, useState } from "react";
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
import { getCurrentTime, isSuccess } from "../util";
import "../style.css";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { ifSuccess, checkError, checkResult } from "@/components/page/util";

function EditorPage() {
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id"));

  // article vars
  const [title, setTitle] = useState(); // title
  const [content, setContent] = useState(""); // content

  // config vars
  const [drawerOpen, setDrawerOpen] = useState(false); // open config drawer?

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
        if (!isSuccess(r)) {
          return;
        }
        let meta = result.data.meta;
        setTitle(meta.title);
        setContent(result.data.content);
        form.setValue(
          "tags",
          meta.tags.map((e) => {
            text: e;
          })
        );
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
    meta["tags"] = meta["tags"].map((e) => e.text);
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

  const ToolBtn = ({ icon, onClick }) => {
    const LucideIcon = icons[icon];
    return (
      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClick}>
        <LucideIcon size="18" color="#676565" strokeWidth={1.5} />
      </Button>
    );
  };

  return (
    <Drawer direction="right">
      <div className="flex flex-col h-screen space-y-1">
        <Toaster position="top-center" />
        <div
          className="flex justify-end w-full space-x-2 border-b pr-4 shadow-none"
          style={{ "--wails-draggable": "drag" }}
        >
          <Link to="/">
            <Button variant="ghost" size="icon" className="w-8 h-8 m-1">
              <MoveLeft size="18" color="#676565" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 m-1"
            onClick={save}
          >
            <Check size="18" color={changed ? "#13cd64" : "#676565"} />
          </Button>
        </div>
        <div className="flex justify-center items-center relative">
          <div className="flex flex-col w-3/5">
            <input
              className="border-0 border-none shadow-none ring-0 focus:ring-0 h-10 text-lg py-1 px-2 editor-title-input"
              placeholder="Title..."
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
                marginTop: 3,
                marginBottom: 10,
                border: "none",
              }}
              hideToolbar={true}
              height="calc(100vh - 100px)"
              preview={preview}
              textareaProps={{
                id: mdTextAreaId,
                placeholder: "Write you text",
              }}
            />
          </div>
          <div className="fixed top-1/2 right-1 transform -translate-y-1/2 h-[100px] flex flex-col space-y-1">
            <ToolBtn icon="Image" onClick={insertImage}></ToolBtn>
            <ToolBtn icon={previewIcon} onClick={previewToggle}></ToolBtn>
            <DrawerTrigger variant="ghost" size="icon" className="w-8 h-8">
              <ToolBtn icon="Settings"></ToolBtn>
            </DrawerTrigger>
          </div>
        </div>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Article Meta</DrawerTitle>
          </DrawerHeader>
          <Separator className="my-4" />
          <Form {...form}>
            <form className="space-y-4 mx-5">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
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
                          input: "h-10",
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
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input placeholder="Create time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              ></FormField>
              <FormField
                control={form.control}
                name="lastmod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lastmod</FormLabel>
                    <FormControl>
                      <Input placeholder="Last modify time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              ></FormField>
            </form>
          </Form>
          <DrawerClose className="mt-4">
            <Button variant="outline" className="w-1/2">
              Close
            </Button>
          </DrawerClose>
        </DrawerContent>
      </div>
    </Drawer>
  );
}

export default EditorPage;
