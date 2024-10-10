import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  icons,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArticleList,
  ArticleRemove,
  SitePreview,
  SiteDeploy,
} from "/wailsjs/go/backend/App";
import { isSuccess, checkError, checkResult } from "@/components/page/util";

function Home() {
  const [articles, setArticles] = useState([]);
  const [checked, setChecked] = useState([]);
  const [deleteBtnShow, setDeleteBtnShow] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function enterSearch(e) {
    if (e.key === "Enter") {
      doSearch();
    }
  }

  function doSearch() {
    ArticleList(search, page).then((r) => {
      if (isSuccess(r)) {
        setTotal(r.data.total);
        setArticles(r.data.list);
      }
    });
  }

  useEffect(() => {
    doSearch();
  }, []);

  useEffect(() => {
    doSearch();
  }, [page]);

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
          doSearch();
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

  function pageSearch(type) {
    if (type === "first" && page > 0) {
      setPage(0);
    } else if (type === "prev" && page > 0) {
      setPage(page - 1);
    } else if (type === "next" && page < calPage()) {
      setPage(page + 1);
    } else if (type === "last" && page < calPage()) {
      setPage(calPage());
    }
  }

  function calPage() {
    return Math.ceil(total / 10) - 1;
  }
  
  const IBtn = ({ icon, onClick }) => {
    const LucideIcon = icons[icon];
    return (
      <Button
        className="m-1 w-8 h-8 hover:bg-slate-300"
        variant="ghost"
        size="icon"
        onClick={onClick}
      >
        <LucideIcon size="18" color="#676767" strokeWidth={1.5} />
      </Button>
    );
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen space-y-2">
        {/* header */}
        <div
          className="flex items-center py-1 bg-[rgb(247,247,247)]"
          style={{ "--wails-draggable": "drag" }}
        >
          <div className="flex-1"></div>
          <div className="flex-1 flex items-center">
            <Input
              placeholder="search"
              className="h-8"
              onKeyDown={enterSearch}
              onChange={(e) => setSearch(e.target.value)}
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
          <div className="flex-1 flex justify-end pr-2">
            <Link to="/editor">
              <IBtn icon="SquarePlus" />
            </Link>
            <IBtn icon="View" onClick={preview} />
            <IBtn icon="Rocket" onClick={deploy} />
            <Link to="/settings">
              <IBtn icon="Settings" />
            </Link>
          </div>
        </div>
        {/* header */}

        {/* body */}
        <div className="flex flex-col flex-grow overflow-auto scrollbar-hide space-y-2 text-slate-500 bg-[rgb(255,255,255)] px-10">
          {articles.map((item) => (
            <div
              className="flex border rounded-lg py-4 px-4 items-center"
              onClick={() => navigate("/editor?id=" + item.id)}
              key={item.id}
            >
              <div className="flex-none" onClick={e => e.stopPropagation()}>
                <Checkbox
                  onCheckedChange={(e) => checkedChange(e, item.id + "")}
                />
              </div>
              <div className="basis-1/2 text-xl pl-5 text-slate-800">
                {item.title}
              </div>
              <div className="basis-1/4 flex justify-center text-sm">
                {item.tags}
              </div>
              <div className="basis-1/4 flex justify-center text-sm">
                {item.createTime}
              </div>
            </div>
          ))}
        </div>
        {/* body */}

        {/* footer */}
        <div className="flex items-center w-full py-1 bg-[rgb(247,247,247)]">
          <div className="flex-1 text-xs pl-5 text-slate-500">
            Total {total}
          </div>
          <div className="flex-1 flex justify-center">
            <Button
              className="m-1 h-6 w-10 hover:bg-slate-300"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("first")}
            >
              <ChevronsLeft color="#676565" strokeWidth={1.5} size={22} />
            </Button>
            <Button
              className="m-1 h-6 w-10 hover:bg-slate-300"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("prev")}
            >
              <ChevronLeft color="#676565" strokeWidth={1.5} size={22} />
            </Button>
            <Button
              className="m-1 h-6 w-10 hover:bg-slate-300"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("next")}
            >
              <ChevronRight color="#676565" strokeWidth={1.5} size={22} />
            </Button>
            <Button
              className="m-1 h-6 w-10 hover:bg-slate-300"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("last")}
            >
              <ChevronsRight color="#676565" strokeWidth={1.5} size={22} />
            </Button>
          </div>
          <div className="flex-1"></div>
        </div>
        {/* footer */}
      </div>
    </>
  );
}

export default Home;
