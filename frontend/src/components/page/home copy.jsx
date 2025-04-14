import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const tags = [
    { id: 1, name: "工作", color: "#e6f4ff", textColor: "#1677ff" },
    { id: 2, name: "学习", color: "#f6ffed", textColor: "#52c41a" },
    { id: 3, name: "生活", color: "#fffbe6", textColor: "#faad14" },
  ];

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

  const getTagStyle = (tagName) => {
    return { backgroundColor: "#e6f4ff", color: "#1677ff" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen max-w-[1440px] mx-auto">
        {/* 主内容区 */}
        <div className="flex flex-col min-h-screen">
          {/* header */}
          <div
            className="flex items-center py-2 bg-[rgb(247,247,247)]"
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
                <Button
                  className="!rounded-button whitespace-nowrap h-8 flex items-center justify-center"
                  variant="default"
                >
                  <i className="fa-solid fa-plus text-sm mr-2" />
                  新建笔记
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="!rounded-button whitespace-nowrap h-8 flex items-center justify-center"
              >
                <i className="fa-regular fa-eye text-sm mr-2" />
                预览
              </Button>
              <Button
                variant="ghost"
                className="!rounded-button whitespace-nowrap h-8 flex items-center justify-center"
              >
                <i className="fa-solid fa-cloud-arrow-up text-sm mr-2" />
                部署
              </Button>
              <Link to="/settings">
                <Button
                  variant="ghost"
                  className="!rounded-button whitespace-nowrap h-8 flex items-center justify-center"
                >
                  <i className="fa-solid fa-gear text-sm mr-2" />
                  配置
                </Button>
              </Link>
            </div>
          </div>
          {/* header */}
          {/* 标签区域 */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-3 flex items-center">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    className="!rounded-button"
                    style={{
                      backgroundColor: tag.color,
                      color: tag.textColor,
                    }}
                    variant="outline"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {/* 笔记列表 */}
          <div className="flex-1 overflow-auto pb-[76px]">
            <div className="p-4 space-y-2">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="w-full hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {article.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {article.date}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.split(",").map((tag, index) => (
                        <Badge
                          key={index}
                          className="!rounded-button"
                          style={getTagStyle(tag)}
                          variant="outline"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* 分页 */}
            <div className="flex justify-center py-6 border-t border-gray-100 bg-white fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px]">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="!rounded-button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <i className="fa-solid fa-chevron-left mr-2 text-xs" />
                  上一页
                </Button>
                <div className="flex items-center gap-1 px-4">
                  <span className="text-sm text-gray-700">第 {page} 页</span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-400">
                    共 {Math.ceil(30 / 10)} 页
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="!rounded-button"
                  onClick={() =>
                    setPage((prev) => Math.min(Math.ceil(30 / 10), prev + 1))
                  }
                  disabled={page === Math.ceil(30 / 10)}
                >
                  下一页
                  <i className="fa-solid fa-chevron-right ml-2 text-xs" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
