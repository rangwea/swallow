import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  icons,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArticleList,
  ArticleRemove,
  SitePreview,
  SiteDeploy,
} from "/wailsjs/go/backend/App";
import { ifSuccess, isSuccess, checkError, checkResult } from "@/components/page/util";

function Home() {
  const [articles, setArticles] = useState([]);
  const [checked, setChecked] = useState([]);
  const [deleteBtnShow, setDeleteBtnShow] = useState(false);

  function searchArticles(e) {
    if (e === "" || e.key === "Enter") {
      let text = e === "" ? e : e.target.value;
      ArticleList(text).then((r) => ifSuccess(r, setArticles));
    }
  }

  useEffect(() => {
    searchArticles("");
  }, []);

  function preview() {
    SitePreview().then(checkError);
  }

  function deploy() {
    SiteDeploy().then((r) => checkResult(r, "deploy success"));
  }

  function removeArticle() {
    if (checked.length > 0) {
      ArticleRemove(checked).then((r) => {
        if (isSuccess(r)) {
          toast.info(`removed ${checked.length} articles`, 2);
          searchArticles("", null);
          setChecked([]);
          setDeleteBtnShow(false);
        } 
      });
    }
  }

  function checkedChange(e, id) {
    let n = [];
    if (e) {
      n = [...checked, id];
    } else {
      n = checked.filter((v) => v !== id);
    }
    setDeleteBtnShow(n.length > 0);
    setChecked(n);
  }

  const IBtn = ({ icon, onClick }) => {
    const LucideIcon = icons[icon];
    return (
      <Button
        className="m-1 w-8 h-8"
        variant="ghost"
        size="icon"
        onClick={onClick}
      >
        <LucideIcon size="20" color="#676565" strokeWidth={1.5} />
      </Button>
    );
  };

  return (
    <>
      <div className="h-screen">
        <Toaster position="top-center" />
        <div
          className="flex items-center pt-10 px-16"
          style={{ "--wails-draggable": "drag" }}
        >
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">Swallow</h2>
            <p className="text-gray-500">All moments will be lost in time!</p>
          </div>
          <Card className="ml-auto">
            <Link to="/editor">
              <IBtn icon="SquarePlus" />
            </Link>
            <IBtn icon="View" onClick={preview} />
            <IBtn icon="Rocket" onClick={deploy} />
            <Link to="/settings">
              <IBtn icon="Settings" />
            </Link>
          </Card>
        </div>

        <div className="flex flex-col mt-5 mx-16">
          <div className="flex items-center">
            <Input
              placeholder="search"
              className="w-1/4 h-8"
              onKeyDown={searchArticles}
            />
            {deleteBtnShow ? (
              <Button
                className="w-6 h-6 ml-2"
                variant="ghost"
                size="icon"
                onClick={removeArticle}
              >
                <Trash2 size="18" color="#676565" strokeWidth={1.5} />
              </Button>
            ) : null}
          </div>
          <div className="border border-slate-200 rounded-lg text-slate-600 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        onCheckedChange={(e) => checkedChange(e, item.id)}
                      />
                    </TableCell>
                    <TableCell className="text-lg">
                      <Link to={"/editor?id=" + item.id}>{item.title}</Link>
                    </TableCell>
                    <TableCell>{item.createTime}</TableCell>
                    <TableCell className="text-right">{item.tags}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center fixed bottom-0 border-t w-full py-1">
        <Button className="m-1 h-8 w-10" variant="outline" size="icon">
          <ChevronsLeft color="#676565" strokeWidth={1.5} size={22} />
        </Button>
        <Button className="m-1 h-8 w-10" variant="outline" size="icon">
          <ChevronLeft color="#676565" strokeWidth={1.5} size={22} />
        </Button>
        <Button className="m-1 h-8 w-10" variant="outline" size="icon">
          <ChevronRight color="#676565" strokeWidth={1.5} size={22} />
        </Button>
        <Button className="m-1 h-8 w-10" variant="outline" size="icon">
          <ChevronsRight color="#676565" strokeWidth={1.5} size={22} />
        </Button>
      </div>
    </>
  );
}

export default Home;
