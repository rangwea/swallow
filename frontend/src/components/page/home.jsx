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
        className="m-1 w-9 h-9 hover:bg-accent/20 hover:scale-110 transition-all duration-300 hover:shadow-sm"
        variant="ghost"
        size="icon"
        onClick={onClick}
      >
        <LucideIcon size="20" className="text-foreground/70" strokeWidth={1.75} />
      </Button>
    );
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-secondary/10">
        {/* header */}
        <div
          className="flex items-center py-4 px-8 backdrop-blur-md bg-card/60 border-b border-border/30 relative overflow-hidden"
          style={{ "--wails-draggable": "drag" }}
        >
          {/* Decorative accent line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent"></div>

          <div className="flex-1"></div>

          <div className="flex-1 flex items-center justify-center gap-3 max-w-md mx-auto">
            <Input
              placeholder="Search articles..."
              className="h-11 bg-background/70 border-border/40 focus:border-accent transition-all duration-300 placeholder:text-muted-foreground/40 shadow-sm"
              onKeyDown={enterSearch}
              onChange={(e) => setSearch(e.target.value)}
            />
            {deleteBtnShow ? (
              <Button
                className="w-11 h-11 hover:bg-destructive/15 hover:text-destructive transition-all duration-300 hover:rotate-6"
                variant="ghost"
                size="icon"
                onClick={removeArticle}
              >
                <Trash2 size="20" strokeWidth={1.75} />
              </Button>
            ) : null}
          </div>

          <div className="flex-1 flex justify-end gap-2">
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
        <div className="flex-grow overflow-auto scrollbar-hide px-16 py-10">
          {/* Stats Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/30">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-serif text-foreground/90 tabular-nums">{total}</span>
              <span className="text-base text-muted-foreground tracking-wider uppercase">Articles</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {page + 1} of {calPage() + 1}</span>
            </div>
          </div>

          {/* Article Grid */}
          <div className="grid grid-cols-1 gap-6 pb-8">
            {articles.map((item, index) => {
              // Split tags by comma
              const tagList = item.tags ? item.tags.split(',').filter(t => t.trim()) : [];

              return (
                <div
                  className="group relative flex items-center border border-border/40 rounded-2xl py-6 px-8 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:shadow-xl hover:scale-[1.005] hover:border-accent/30 transition-all duration-500 cursor-pointer animate-in overflow-hidden gap-6"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => navigate("/editor?id=" + item.id)}
                  key={item.id}
                >
                  {/* Decorative gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Checkbox */}
                  <div className="flex-none z-10" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      className="border-2 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      onCheckedChange={(e) => checkedChange(e, item.id + "")}
                    />
                  </div>

                  {/* Content: Two rows */}
                  <div className="flex-1 z-10 min-w-0">
                    {/* Row 1: Title */}
                    <h2 className="text-2xl font-serif text-foreground/90 group-hover:text-accent transition-colors duration-400 leading-tight mb-2 truncate">
                      {item.title}
                    </h2>

                    {/* Row 2: Tags + Time */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Tags */}
                      {tagList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tagList.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent/90 text-xs font-medium tracking-wide uppercase border border-accent/20 hover:bg-accent/20 transition-colors duration-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Time info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span className="tracking-wider">{item.createTime}</span>
                        </div>

                        {item.updateTime && item.updateTime !== item.createTime && (
                          <div className="flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            <span className="tracking-wider">{item.updateTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Arrow indicator */}
                  <div className="flex-none z-10 text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>

                  {/* Bottom decorative line */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent via-accent/50 to-transparent group-hover:w-full transition-all duration-700 ease-out"></div>
                </div>
              );
            })}
          </div>
        </div>
        {/* body */}

        {/* footer */}
        <div className="flex items-center w-full py-4 px-8 backdrop-blur-md bg-card/60 border-t border-border/30">
          <div className="flex-1"></div>
          <div className="flex justify-center gap-2">
            <Button
              className="h-9 w-14 hover:bg-accent/15 hover:text-accent transition-all duration-300 disabled:opacity-30"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("first")}
              disabled={page === 0}
            >
              <ChevronsLeft strokeWidth={1.75} size={20} />
            </Button>
            <Button
              className="h-9 w-14 hover:bg-accent/15 hover:text-accent transition-all duration-300 disabled:opacity-30"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("prev")}
              disabled={page === 0}
            >
              <ChevronLeft strokeWidth={1.75} size={20} />
            </Button>
            <div className="flex items-center px-4 text-sm font-medium text-foreground/70 min-w-[80px] justify-center">
              {page + 1} / {calPage() + 1}
            </div>
            <Button
              className="h-9 w-14 hover:bg-accent/15 hover:text-accent transition-all duration-300 disabled:opacity-30"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("next")}
              disabled={page >= calPage()}
            >
              <ChevronRight strokeWidth={1.75} size={20} />
            </Button>
            <Button
              className="h-9 w-14 hover:bg-accent/15 hover:text-accent transition-all duration-300 disabled:opacity-30"
              variant="ghost"
              size="icon"
              onClick={() => pageSearch("last")}
              disabled={page >= calPage()}
            >
              <ChevronsRight strokeWidth={1.75} size={20} />
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
