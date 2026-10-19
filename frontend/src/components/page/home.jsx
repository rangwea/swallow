import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArticleList,
  ArticleRemove,
  SitePreview,
  SiteDeploy,
  ConfGet,
} from "/wailsjs/go/backend/App";
import { isSuccess, checkError, checkResult } from "@/components/page/util";
import { t } from "@/lib/i18n";
import { toggleFromWindowHeader } from "@/components/layout/window-header";
import ToolButton from "@/components/layout/tool-button";

function Home() {
  const [articles, setArticles] = useState([]);
  const [checked, setChecked] = useState([]);
  const [deleteBtnShow, setDeleteBtnShow] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchToggleRef = useRef(null);
  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.querySelector("input")?.focus();
    function dismiss(event) {
      if (!searchRef.current?.contains(event.target) && !searchToggleRef.current?.contains(event.target)) setSearchOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [searchOpen]);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [showArticlesStats, setShowArticlesStats] = useState(true);
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
    loadAppearanceSettings();
  }, []);

  function loadAppearanceSettings() {
    ConfGet("app").then((result) => {
      if (isSuccess(result) && result.data) {
        setArticlesPerPage(result.data.articlesPerPage || 10);
        setShowArticlesStats(
          result.data.showArticlesStats !== undefined
            ? result.data.showArticlesStats
            : true
        );
      }
    });
  }

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
    return Math.max(0, Math.ceil(total / articlesPerPage) - 1);
  }
  
  return (
    <>
      <Toaster position="top-center" />
      <div className="home-shell flex flex-col h-screen overflow-hidden">
        <header className="home-fixed-header" style={{ "--wails-draggable": "drag" }} onDoubleClick={toggleFromWindowHeader}>
          <div className="home-header-spacer" aria-hidden="true" />
          <div ref={searchRef} id="home-search-field" className={`home-search${searchOpen ? " is-open" : ""}`}
            onKeyDown={(event) => {
              if (event.key === "Escape" && searchOpen) {
                event.stopPropagation(); setSearchOpen(false); searchToggleRef.current?.focus();
              }
            }}>
            <Input aria-label={t("searchPlaceholder")} placeholder={t("searchPlaceholder")}
              value={search} onKeyDown={enterSearch}
              onChange={(event) => setSearch(event.target.value)} />
            <ToolButton className="home-search-button" icon="Search" label={t("searchPlaceholder")} onClick={doSearch} />
          </div>
          <ToolButton ref={searchToggleRef} className="home-search-toggle home-action-button" icon="Search"
            label={t("searchPlaceholder")} aria-controls="home-search-field" aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)} />
          <div className="home-header-actions" role="group" aria-label={t("homeActions")}>
            {deleteBtnShow && <ToolButton className="home-action-button home-action-delete" icon="Trash2" label={t("deleteSelected")} onClick={removeArticle} />}
            <Link to="/editor"><ToolButton className="home-action-button home-action-primary" icon="SquarePlus" label={t("newArticle")} /></Link>
            <ToolButton className="home-action-button" icon="View" label={t("preview")} onClick={preview} />
            <ToolButton className="home-action-button" icon="Rocket" label={t("deploy")} onClick={deploy} />
            <Link to="/settings"><ToolButton className="home-action-button" icon="Settings" label={t("settings")} /></Link>
          </div>
        </header>
        <div className="home-content flex-1 min-h-0 overflow-auto px-8 py-6">
          {/* Stats Bar - conditionally rendered */}
          {showArticlesStats && (
            <div className="home-article-stats">
              <div className="home-article-count">
                <span className="home-article-total">{total}</span>
                <span className="home-article-count-label">{t("articlesCount")}</span>
              </div>
              <div className="home-article-page-label">
                <span>{t("page")} {page + 1} {t("of")} {calPage() + 1}</span>
              </div>
            </div>
          )}

          {/* Article Grid */}
          <div className="article-list">
            {articles.map((item) => {
              // Split tags by comma
              const tagList = item.tags ? item.tags.split(',').filter(t => t.trim()) : [];

              return (
                <div
                  className="article-row group"
                  onClick={() => navigate("/editor?id=" + item.id)}
                  key={item.id}
                >
                  {/* Checkbox */}
                  <div className="flex-none z-10" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      aria-label={item.title}
                      checked={checked.includes(String(item.id))}
                      className="article-checkbox data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      onCheckedChange={(e) => checkedChange(e, item.id + "")}
                    />
                  </div>

                  {/* Content: Two rows */}
                  <div className="flex-1 z-10 min-w-0">
                    {/* Row 1: Title */}
                    <h2 className="article-title" title={item.title}>
                      {item.title}
                    </h2>

                    {/* Row 2: Tags + Time */}
                    <div className="article-meta">
                      {/* Tags */}
                      {tagList.length > 0 && (
                        <div className="article-tags">
                          {tagList.map((tag, idx) => (
                            <span
                              key={idx}
                              className="article-tag" title={tag.trim()}
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Time info */}
                      <div className="article-times" title={[item.createTime, item.updateTime].filter(Boolean).join(" / ")}>
                        <div className="article-time">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span className="article-date">{item.createTime}</span>
                        </div>

                        {item.updateTime && item.updateTime !== item.createTime && (
                          <div className="article-time">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            <span className="article-date">{item.updateTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Arrow indicator */}
                  <div className="article-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
        {/* body */}

        <footer className="home-footer">
          <nav className="home-pagination" aria-label={t("pagination")}>
            <div className="home-page-controls">
              <Button className="home-page-button" variant="ghost" size="icon"
                aria-label={t("firstPage")} title={t("firstPage")}
                onClick={() => pageSearch("first")} disabled={page === 0}>
                <ChevronsLeft strokeWidth={1.75} size={17} />
              </Button>
              <Button className="home-page-button" variant="ghost" size="icon"
                aria-label={t("previousPage")} title={t("previousPage")}
                onClick={() => pageSearch("prev")} disabled={page === 0}>
                <ChevronLeft strokeWidth={1.75} size={18} />
              </Button>
            </div>
            <div className="home-page-position" role="status" aria-live="polite" aria-atomic="true">
              <span className="home-current-page">{page + 1}</span>
              <span className="home-page-separator">/</span>
              <span>{calPage() + 1}</span>
            </div>
            <div className="home-page-controls">
              <Button className="home-page-button" variant="ghost" size="icon"
                aria-label={t("nextPage")} title={t("nextPage")}
                onClick={() => pageSearch("next")} disabled={page >= calPage()}>
                <ChevronRight strokeWidth={1.75} size={18} />
              </Button>
              <Button className="home-page-button" variant="ghost" size="icon"
                aria-label={t("lastPage")} title={t("lastPage")}
                onClick={() => pageSearch("last")} disabled={page >= calPage()}>
                <ChevronsRight strokeWidth={1.75} size={17} />
              </Button>
            </div>
          </nav>
        </footer>
      </div>
    </>
  );
}

export default Home;
