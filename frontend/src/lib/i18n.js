// 国际化翻译配置
export const translations = {
  "zh-CN": {
    // Common
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    close: "关闭",

    // Settings
    settings: "设置",
    settingsDesc: "管理你的账户设置和偏好",
    appearance: "外观",
    theme: "主题",
    deploy: "部署",

    // Appearance Settings
    appearanceTitle: "外观",
    appearanceDesc: "自定义应用的外观和体验",
    appTheme: "应用主题",
    appThemeDesc: "选择应用的颜色主题",
    articlesPerPage: "每页文章数",
    articlesPerPageDesc: "主页列表每页显示的文章数量",
    articlesStats: "文章统计",
    articlesStatsDesc: "在主页显示文章总数和页码信息",
    show: "显示",
    hide: "隐藏",
    displayStats: "显示统计",
    hideStats: "隐藏统计",
    language: "界面语言",
    languageDesc: "选择应用的显示语言",
    editorSettings: "编辑器设置",
    editorSettingsDesc: "自定义文章编辑器的字体和排版",
    titleFont: "标题字体",
    titleFontDesc: "文章标题使用的字体",
    contentFont: "正文字体",
    contentFontDesc: "文章内容使用的字体",
    lineHeight: "行距",
    lineHeightDesc: "文章内容的行高",
    fontSize: "字体大小",
    fontSizeDesc: "文章内容的字体大小（像素）",
    saveChanges: "保存更改",
    settingsSaved: "设置保存成功",
    settingsSaving: "保存中…",
    settingsUnsaved: "有未保存的更改",
    settingsSavedInline: "已保存",
    settingsRetry: "重试",
    settingsLoadFailed: "无法读取设置，请重试",
    settingsInvalidPageSize: "每页文章数需为 1–100 的整数",
    settingsFailed: "保存设置失败",

    // Home Page
    articles: "文章",
    searchPlaceholder: "搜索文章...",
    total: "共",
    articlesCount: "篇文章",
    page: "第",
    of: "页，共",
    pages: "页",
    newArticle: "新建文章",
    preview: "预览",

    editorEdit: "编辑",
    editorBack: "返回文章列表",
    homeActions: "首页操作",
    pagination: "文章分页",
    firstPage: "第一页",
    previousPage: "上一页",
    nextPage: "下一页",
    lastPage: "最后一页",
    editorDragToolbar: "拖动工具栏，松手吸附四侧（方向键也可停靠）",
    editorSplit: "分屏",
    editorMode: "编辑模式",
    editorSave: "保存",
    editorSaving: "保存中…",
    editorUnsaved: "未保存",
    editorSaved: "已保存",
    editorLoading: "加载中…",
    editorInsertImage: "插入图片",
    editorInsertTable: "插入表格",
    editorInsertLink: "插入链接",
    editorTextColor: "文字颜色",
    editorSelectText: "请先选中需要设置颜色的文字",
    editorTableColumns: "列数（1–12）",
    editorTableRows: "数据行数（1–20）",
    editorTableHeader: "表头",
    editorLinkText: "链接文字",
    editorLinkUrl: "链接地址",
    editorCustomColor: "自定义颜色",
    editorInsert: "插入",
    editorInsertHint: "内容将插入当前光标或替换选中文字。",
    editorColorHint: "使用 HTML span 标签设置所选文字的颜色。",
    editorInvalidLink: "请填写链接文字及有效的网址。",
    editorSelectionChanged: "正文已变化，请重新选择插入位置。",
    editorLoadFailed: "加载文章失败",
    editorSaveFailed: "保存失败，请重试",
    editorImageFailed: "插入图片失败",
    deployBtn: "部署",
    settingsBtn: "设置",
    deleteSelected: "删除选中",
    created: "创建于",
    updated: "更新于",

    // Editor Page
    backToHome: "返回主页",
    saveArticle: "保存",
    unsavedChanges: "未保存的更改",
    titlePlaceholder: "文章标题...",
    contentPlaceholder: "开始写作...",
    insertImage: "插入图片",
    togglePreview: "切换预览",
    articleMeta: "文章信息",
    tags: "标签",
    tagsPlaceholder: "输入标签",
    date: "创建日期",
    createTime: "创建于",
    lastmod: "最后修改",
    updateTime: "更新于",

    // Site Settings
    siteTitle: "站点设置",
    siteDesc: "配置你的站点信息",
    siteTitleLabel: "站点标题",
    siteDescription: "站点描述",
    siteTheme: "站点主题",
    siteLanguage: "站点语言",
    copyright: "版权信息",
    author: "作者",
    avatar: "头像",
    favicon: "网站图标",
    selectImage: "选择图片",

    // Deploy Settings
    deployTitle: "部署设置",
    deployDesc: "配置你的部署选项",
    github: "GitHub",
    cos: "腾讯云 COS",
    oss: "阿里云 OSS",
    netlify: "Netlify",

    // Deploy Form Descriptions - GitHub
    githubPageTitle: "Github Page",
    githubPageDesc: "使用 GitHub Pages 部署站点",
    repositoryDesc: "你的 GitHub 仓库 URL",
    emailDesc: "你的 GitHub 邮箱",
    usernameDesc: "你的 GitHub 用户名",
    tokenDesc: "你的 GitHub 访问令牌",
    cnameDesc: "你的 GitHub Pages 自定义域名",

    // Deploy Form Descriptions - COS
    cosTitle: "腾讯云 COS",
    cosDesc: "使用腾讯云 COS 部署站点",
    secretIdDesc: "你的腾讯云 SecretId",
    secretKeyDesc: "你的腾讯云 SecretKey",
    regionDesc: "COS 存储桶所在地域",
    bucketDesc: "COS 存储桶名称",

    // Deploy Form Descriptions - OSS
    ossTitle: "阿里云 OSS",
    ossDesc: "使用阿里云 OSS 部署站点",
    appIdDesc: "你的阿里云应用 ID",
    ossSecretIdDesc: "你的阿里云 SecretId",
    ossSecretKeyDesc: "你的阿里云 SecretKey",
    ossRegionDesc: "OSS 存储桶所在地域",
    ossBucketDesc: "OSS 存储桶名称",

    // Deploy Form Descriptions - Netlify
    netlifyTitle: "Netlify",
    netlifyDesc: "使用 Netlify 部署站点",
    siteIdDesc: "你的 Netlify 站点 ID",
    netlifyTokenDesc: "你的 Netlify 访问令牌",

    // Themes
    warmSepia: "温暖米色",
    warmSepiaDesc: "温暖的米色主题",
    coolSlate: "冷调灰蓝",
    coolSlateDesc: "冷色调灰蓝主题",
    softRose: "柔和玫瑰",
    softRoseDesc: "柔和的玫瑰粉主题",
    freshEmerald: "清新翡翠",
    freshEmeraldDesc: "清新的翡翠绿主题",
    deepViolet: "深邃紫罗兰",
    deepVioletDesc: "深邃的紫罗兰主题",
    pureWhite: "纯白",
    pureWhiteDesc: "纯白背景与简洁中性色控件",
    neutralGray: "中性灰",
    neutralGrayDesc: "浅灰背景与明亮内容区",

    // Messages
    deleteConfirm: "确认删除？",
    deleteSuccess: "删除成功",
    saveSuccess: "保存成功",
    deploySuccess: "部署成功",
    error: "错误",

    // Error Handling & Logs
    errorOccurred: "出错了",
    errorDescription: "应用遇到了一个错误，请尝试刷新页面",
    errorStack: "查看详情",
    refreshPage: "刷新页面",
    openLogDir: "打开日志目录",
    openLogDirFailed: "打开日志目录失败",
    logSettings: "日志设置",
    logSettingsDesc: "查看应用运行日志，用于排查问题",
    logDir: "日志目录",
    logDirNotFound: "日志目录未找到",
    logDirHint: "日志文件按日期保存，保留最近 7 天的记录",
  },

  "zh-TW": {
    // Common
    save: "儲存",
    cancel: "取消",
    delete: "刪除",
    edit: "編輯",
    close: "關閉",

    // Settings
    settings: "設定",
    settingsDesc: "管理你的帳戶設定和偏好",
    appearance: "外觀",
    theme: "主題",
    deploy: "部署",

    // Appearance Settings
    appearanceTitle: "外觀",
    appearanceDesc: "自訂應用程式的外觀和體驗",
    appTheme: "應用主題",
    appThemeDesc: "選擇應用程式的顏色主題",
    articlesPerPage: "每頁文章數",
    articlesPerPageDesc: "主頁列表每頁顯示的文章數量",
    articlesStats: "文章統計",
    articlesStatsDesc: "在主頁顯示文章總數和頁碼資訊",
    show: "顯示",
    hide: "隱藏",
    displayStats: "顯示統計",
    hideStats: "隱藏統計",
    language: "介面語言",
    languageDesc: "選擇應用程式的顯示語言",
    editorSettings: "編輯器設定",
    editorSettingsDesc: "自訂文章編輯器的字體和排版",
    titleFont: "標題字體",
    titleFontDesc: "文章標題使用的字體",
    contentFont: "正文字體",
    contentFontDesc: "文章內容使用的字體",
    lineHeight: "行距",
    lineHeightDesc: "文章內容的行高",
    fontSize: "字體大小",
    fontSizeDesc: "文章內容的字體大小（像素）",
    saveChanges: "儲存變更",
    settingsSaved: "設定儲存成功",
    settingsSaving: "儲存中…",
    settingsUnsaved: "有未儲存的變更",
    settingsSavedInline: "已儲存",
    settingsRetry: "重試",
    settingsLoadFailed: "無法讀取設定，請重試",
    settingsInvalidPageSize: "每頁文章數必須為 1–100 的整數",
    settingsFailed: "儲存設定失敗",

    // Home Page
    articles: "文章",
    searchPlaceholder: "搜尋文章...",
    total: "共",
    articlesCount: "篇文章",
    page: "第",
    of: "頁，共",
    pages: "頁",
    newArticle: "新建文章",
    preview: "預覽",

    editorEdit: "編輯",
    editorBack: "返回文章清單",
    homeActions: "首頁操作",
    pagination: "文章分頁",
    firstPage: "第一頁",
    previousPage: "上一頁",
    nextPage: "下一頁",
    lastPage: "最後一頁",
    editorDragToolbar: "拖動工具列，放開吸附四側（方向鍵亦可停靠）",
    editorSplit: "分割",
    editorMode: "編輯模式",
    editorSave: "儲存",
    editorSaving: "儲存中…",
    editorUnsaved: "未儲存",
    editorSaved: "已儲存",
    editorLoading: "載入中…",
    editorInsertImage: "插入圖片",
    editorInsertTable: "插入表格",
    editorInsertLink: "插入連結",
    editorTextColor: "文字顏色",
    editorSelectText: "請先選取需要設定顏色的文字",
    editorTableColumns: "欄數（1–12）",
    editorTableRows: "資料列數（1–20）",
    editorTableHeader: "表頭",
    editorLinkText: "連結文字",
    editorLinkUrl: "連結網址",
    editorCustomColor: "自訂顏色",
    editorInsert: "插入",
    editorInsertHint: "內容會插入游標位置或取代所選文字。",
    editorColorHint: "使用 HTML span 標籤設定所選文字顏色。",
    editorInvalidLink: "請填寫連結文字及有效網址。",
    editorSelectionChanged: "內文已變更，請重新選取插入位置。",
    editorLoadFailed: "載入文章失敗",
    editorSaveFailed: "儲存失敗，請重試",
    editorImageFailed: "插入圖片失敗",
    deployBtn: "部署",
    settingsBtn: "設定",
    deleteSelected: "刪除選取",
    created: "建立於",
    updated: "更新於",

    // Editor Page
    backToHome: "返回主頁",
    saveArticle: "儲存",
    unsavedChanges: "未儲存的變更",
    titlePlaceholder: "文章標題...",
    contentPlaceholder: "開始寫作...",
    insertImage: "插入圖片",
    togglePreview: "切換預覽",
    articleMeta: "文章資訊",
    tags: "標籤",
    tagsPlaceholder: "輸入標籤",
    date: "建立日期",
    createTime: "建立於",
    lastmod: "最後修改",
    updateTime: "更新於",

    // Site Settings
    siteTitle: "站點設定",
    siteDesc: "配置你的站點資訊",
    siteTitleLabel: "站點標題",
    siteDescription: "站點描述",
    siteTheme: "站點主題",
    siteLanguage: "站點語言",
    copyright: "版權資訊",
    author: "作者",
    avatar: "頭像",
    favicon: "網站圖示",
    selectImage: "選擇圖片",

    // Deploy Settings
    deployTitle: "部署設定",
    deployDesc: "配置你的部署選項",
    github: "GitHub",
    cos: "騰訊雲 COS",
    oss: "阿里雲 OSS",
    netlify: "Netlify",

    // Deploy Form Descriptions - GitHub
    githubPageTitle: "Github Page",
    githubPageDesc: "使用 GitHub Pages 部署站點",
    repositoryDesc: "你的 GitHub 倉庫 URL",
    emailDesc: "你的 GitHub 郵箱",
    usernameDesc: "你的 GitHub 使用者名稱",
    tokenDesc: "你的 GitHub 存取權杖",
    cnameDesc: "你的 GitHub Pages 自訂網域",

    // Deploy Form Descriptions - COS
    cosTitle: "騰訊雲 COS",
    cosDesc: "使用騰訊雲 COS 部署站點",
    secretIdDesc: "你的騰訊雲 SecretId",
    secretKeyDesc: "你的騰訊雲 SecretKey",
    regionDesc: "COS 儲存桶所在地域",
    bucketDesc: "COS 儲存桶名稱",

    // Deploy Form Descriptions - OSS
    ossTitle: "阿里雲 OSS",
    ossDesc: "使用阿里雲 OSS 部署站點",
    appIdDesc: "你的阿里雲應用 ID",
    ossSecretIdDesc: "你的阿里雲 SecretId",
    ossSecretKeyDesc: "你的阿里雲 SecretKey",
    ossRegionDesc: "OSS 儲存桶所在地域",
    ossBucketDesc: "OSS 儲存桶名稱",

    // Deploy Form Descriptions - Netlify
    netlifyTitle: "Netlify",
    netlifyDesc: "使用 Netlify 部署站點",
    siteIdDesc: "你的 Netlify 站點 ID",
    netlifyTokenDesc: "你的 Netlify 存取權杖",

    // Themes
    warmSepia: "溫暖米色",
    warmSepiaDesc: "溫暖的米色主題",
    coolSlate: "冷調灰藍",
    coolSlateDesc: "冷色調灰藍主題",
    softRose: "柔和玫瑰",
    softRoseDesc: "柔和的玫瑰粉主題",
    freshEmerald: "清新翡翠",
    freshEmeraldDesc: "清新的翡翠綠主題",
    deepViolet: "深邃紫羅蘭",
    deepVioletDesc: "深邃的紫羅蘭主題",
    pureWhite: "純白",
    pureWhiteDesc: "純白背景與簡潔中性色控制項",
    neutralGray: "中性灰",
    neutralGrayDesc: "淺灰背景與明亮內容區",

    // Messages
    deleteConfirm: "確認刪除？",
    deleteSuccess: "刪除成功",
    saveSuccess: "儲存成功",
    deploySuccess: "部署成功",
    error: "錯誤",

    // Error Handling & Logs
    errorOccurred: "出錯了",
    errorDescription: "應用遇到了一個錯誤，請嘗試刷新頁面",
    errorStack: "查看詳情",
    refreshPage: "刷新頁面",
    openLogDir: "打開日誌目錄",
    openLogDirFailed: "打開日誌目錄失敗",
    logSettings: "日誌設定",
    logSettingsDesc: "查看應用運行日誌，用於排查問題",
    logDir: "日誌目錄",
    logDirNotFound: "日誌目錄未找到",
    logDirHint: "日誌文件按日期保存，保留最近 7 天的記錄",
  },

  "en": {
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",

    // Settings
    settings: "Settings",
    settingsDesc: "Manage your account settings and preferences",
    appearance: "Appearance",
    theme: "Theme",
    deploy: "Deploy",

    // Appearance Settings
    appearanceTitle: "Appearance",
    appearanceDesc: "Customize the look and feel of your application",
    appTheme: "App Theme",
    appThemeDesc: "Choose a color theme for your application",
    articlesPerPage: "Articles Per Page",
    articlesPerPageDesc: "Number of articles to display per page in the home list",
    articlesStats: "Articles Statistics",
    articlesStatsDesc: "Display article count and page info on the home page",
    show: "Show",
    hide: "Hide",
    displayStats: "Display statistics",
    hideStats: "Hide statistics",
    language: "Interface Language",
    languageDesc: "Choose the display language for the application",
    editorSettings: "Editor Settings",
    editorSettingsDesc: "Customize article editor fonts and typography",
    titleFont: "Title Font",
    titleFontDesc: "Font family for article titles",
    contentFont: "Content Font",
    contentFontDesc: "Font family for article content",
    lineHeight: "Line Height",
    lineHeightDesc: "Line height for article content",
    fontSize: "Font Size",
    fontSizeDesc: "Font size for article content (pixels)",
    saveChanges: "Save Changes",
    settingsSaved: "Settings saved successfully",
    settingsSaving: "Saving…",
    settingsUnsaved: "Unsaved changes",
    settingsSavedInline: "Saved",
    settingsRetry: "Retry",
    settingsLoadFailed: "Could not load settings. Please retry.",
    settingsInvalidPageSize: "Articles per page must be an integer from 1 to 100",
    settingsFailed: "Failed to save settings",

    // Home Page
    articles: "Articles",
    searchPlaceholder: "Search articles...",
    total: "Total",
    articlesCount: "articles",
    page: "Page",
    of: "of",
    pages: "",
    newArticle: "New Article",
    preview: "Preview",

    editorEdit: "Edit",
    editorBack: "Back to articles",
    homeActions: "Home actions",
    pagination: "Article pagination",
    firstPage: "First page",
    previousPage: "Previous page",
    nextPage: "Next page",
    lastPage: "Last page",
    editorDragToolbar: "Drag toolbar to dock on any edge (or use arrow keys)",
    editorSplit: "Split",
    editorMode: "Editor mode",
    editorSave: "Save",
    editorSaving: "Saving…",
    editorUnsaved: "Unsaved",
    editorSaved: "Saved",
    editorLoading: "Loading…",
    editorInsertImage: "Insert image",
    editorInsertTable: "Insert table",
    editorInsertLink: "Insert link",
    editorTextColor: "Text color",
    editorSelectText: "Select text to apply a color first",
    editorTableColumns: "Columns (1–12)",
    editorTableRows: "Data rows (1–20)",
    editorTableHeader: "Header",
    editorLinkText: "Link text",
    editorLinkUrl: "Link URL",
    editorCustomColor: "Custom color",
    editorInsert: "Insert",
    editorInsertHint: "Insert at the cursor or replace the selected text.",
    editorColorHint: "Apply a color using an HTML span tag.",
    editorInvalidLink: "Enter link text and a valid URL.",
    editorSelectionChanged: "Content changed. Select the insertion point again.",
    editorLoadFailed: "Could not load article",
    editorSaveFailed: "Could not save; please retry",
    editorImageFailed: "Could not insert image",
    deployBtn: "Deploy",
    settingsBtn: "Settings",
    deleteSelected: "Delete Selected",
    created: "Created",
    updated: "Updated",

    // Editor Page
    backToHome: "Back to Home",
    saveArticle: "Save",
    unsavedChanges: "Unsaved Changes",
    titlePlaceholder: "Article title...",
    contentPlaceholder: "Start writing...",
    insertImage: "Insert Image",
    togglePreview: "Toggle Preview",
    articleMeta: "Article Meta",
    tags: "Tags",
    tagsPlaceholder: "Enter a tag",
    date: "Date",
    createTime: "Created",
    lastmod: "Last Modified",
    updateTime: "Updated",

    // Site Settings
    siteTitle: "Site Settings",
    siteDesc: "Configure your site information",
    siteTitleLabel: "Site Title",
    siteDescription: "Site Description",
    siteTheme: "Site Theme",
    siteLanguage: "Site Language",
    copyright: "Copyright",
    author: "Author",
    avatar: "Avatar",
    favicon: "Favicon",
    selectImage: "Select Image",

    // Deploy Settings
    deployTitle: "Deploy Settings",
    deployDesc: "Configure your deployment options",
    github: "GitHub",
    cos: "Tencent COS",
    oss: "Alibaba OSS",
    netlify: "Netlify",

    // Deploy Form Descriptions - GitHub
    githubPageTitle: "Github Page",
    githubPageDesc: "Deploy site with GitHub Pages",
    repositoryDesc: "Your GitHub repository URL",
    emailDesc: "Your GitHub email address",
    usernameDesc: "Your GitHub username",
    tokenDesc: "Your GitHub access token",
    cnameDesc: "Your GitHub Pages custom domain",

    // Deploy Form Descriptions - COS
    cosTitle: "Tencent Cloud COS",
    cosDesc: "Deploy site with Tencent Cloud COS",
    secretIdDesc: "Your Tencent Cloud SecretId",
    secretKeyDesc: "Your Tencent Cloud SecretKey",
    regionDesc: "COS bucket region",
    bucketDesc: "COS bucket name",

    // Deploy Form Descriptions - OSS
    ossTitle: "Alibaba Cloud OSS",
    ossDesc: "Deploy site with Alibaba Cloud OSS",
    appIdDesc: "Your Alibaba Cloud application ID",
    ossSecretIdDesc: "Your Alibaba Cloud SecretId",
    ossSecretKeyDesc: "Your Alibaba Cloud SecretKey",
    ossRegionDesc: "OSS bucket region",
    ossBucketDesc: "OSS bucket name",

    // Deploy Form Descriptions - Netlify
    netlifyTitle: "Netlify",
    netlifyDesc: "Deploy site with Netlify",
    siteIdDesc: "Your Netlify site ID",
    netlifyTokenDesc: "Your Netlify access token",

    // Themes
    warmSepia: "Warm Sepia",
    warmSepiaDesc: "Warm beige color theme",
    coolSlate: "Cool Slate",
    coolSlateDesc: "Cool gray-blue theme",
    softRose: "Soft Rose",
    softRoseDesc: "Soft rose pink theme",
    freshEmerald: "Fresh Emerald",
    freshEmeraldDesc: "Fresh emerald green theme",
    deepViolet: "Deep Violet",
    deepVioletDesc: "Deep violet theme",
    pureWhite: "Pure White",
    pureWhiteDesc: "White background with neutral controls",
    neutralGray: "Neutral Gray",
    neutralGrayDesc: "Light gray background with brighter content areas",

    // Messages
    deleteConfirm: "Confirm deletion?",
    deleteSuccess: "Deleted successfully",
    saveSuccess: "Saved successfully",
    deploySuccess: "Deployed successfully",
    error: "Error",

    // Error Handling & Logs
    errorOccurred: "Something went wrong",
    errorDescription: "The application encountered an error. Please try refreshing the page.",
    errorStack: "View details",
    refreshPage: "Refresh Page",
    openLogDir: "Open Log Directory",
    openLogDirFailed: "Failed to open log directory",
    logSettings: "Log Settings",
    logSettingsDesc: "View application logs for troubleshooting",
    logDir: "Log Directory",
    logDirNotFound: "Log directory not found",
    logDirHint: "Log files are saved daily and kept for the last 7 days",
  },

  "ja": {
    // Common
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    close: "閉じる",

    // Settings
    settings: "設定",
    settingsDesc: "アカウント設定と環境設定を管理",
    appearance: "外観",
    theme: "テーマ",
    deploy: "デプロイ",

    // Appearance Settings
    appearanceTitle: "外観",
    appearanceDesc: "アプリケーションの外観と使用感をカスタマイズ",
    appTheme: "アプリテーマ",
    appThemeDesc: "アプリケーションのカラーテーマを選択",
    articlesPerPage: "1ページあたりの記事数",
    articlesPerPageDesc: "ホームリストに1ページあたり表示する記事数",
    articlesStats: "記事統計",
    articlesStatsDesc: "ホームページに記事数とページ情報を表示",
    show: "表示",
    hide: "非表示",
    displayStats: "統計を表示",
    hideStats: "統計を非表示",
    language: "インターフェース言語",
    languageDesc: "アプリケーションの表示言語を選択",
    editorSettings: "エディター設定",
    editorSettingsDesc: "記事エディターのフォントとタイポグラフィをカスタマイズ",
    titleFont: "タイトルフォント",
    titleFontDesc: "記事タイトルに使用するフォント",
    contentFont: "本文フォント",
    contentFontDesc: "記事内容に使用するフォント",
    lineHeight: "行間",
    lineHeightDesc: "記事内容の行の高さ",
    fontSize: "フォントサイズ",
    fontSizeDesc: "記事内容のフォントサイズ（ピクセル）",
    saveChanges: "変更を保存",
    settingsSaved: "設定が正常に保存されました",
    settingsSaving: "保存中…",
    settingsUnsaved: "未保存の変更があります",
    settingsSavedInline: "保存しました",
    settingsRetry: "再試行",
    settingsLoadFailed: "設定を読み込めません。再試行してください。",
    settingsInvalidPageSize: "1ページの記事数は 1〜100 の整数で指定してください",
    settingsFailed: "設定の保存に失敗しました",

    // Home Page
    articles: "記事",
    searchPlaceholder: "記事を検索...",
    total: "合計",
    articlesCount: "記事",
    page: "ページ",
    of: "/",
    pages: "",
    newArticle: "新規記事",
    preview: "プレビュー",

    editorEdit: "編集",
    editorBack: "記事一覧に戻る",
    homeActions: "ホーム操作",
    pagination: "記事のページ切り替え",
    firstPage: "最初のページ",
    previousPage: "前のページ",
    nextPage: "次のページ",
    lastPage: "最後のページ",
    editorDragToolbar: "ツールバーをドラッグして四辺に配置（矢印キーも使用可）",
    editorSplit: "分割",
    editorMode: "編集モード",
    editorSave: "保存",
    editorSaving: "保存中…",
    editorUnsaved: "未保存",
    editorSaved: "保存済み",
    editorLoading: "読み込み中…",
    editorInsertImage: "画像を挿入",
    editorInsertTable: "表を挿入",
    editorInsertLink: "リンクを挿入",
    editorTextColor: "文字色",
    editorSelectText: "色を付ける文字を選択してください",
    editorTableColumns: "列数（1–12）",
    editorTableRows: "データ行数（1–20）",
    editorTableHeader: "見出し",
    editorLinkText: "リンクの文字",
    editorLinkUrl: "リンク先 URL",
    editorCustomColor: "カスタムカラー",
    editorInsert: "挿入",
    editorInsertHint: "カーソル位置に挿入、または選択した文字を置き換えます。",
    editorColorHint: "HTML span タグで選択した文字に色を付けます。",
    editorInvalidLink: "リンクの文字と有効な URL を入力してください。",
    editorSelectionChanged: "本文が変更されました。挿入位置を再選択してください。",
    editorLoadFailed: "記事を読み込めませんでした",
    editorSaveFailed: "保存に失敗しました",
    editorImageFailed: "画像を挿入できませんでした",
    deployBtn: "デプロイ",
    settingsBtn: "設定",
    deleteSelected: "選択を削除",
    created: "作成",
    updated: "更新",

    // Editor Page
    backToHome: "ホームに戻る",
    saveArticle: "保存",
    unsavedChanges: "未保存の変更",
    titlePlaceholder: "記事のタイトル...",
    contentPlaceholder: "執筆を開始...",
    insertImage: "画像を挿入",
    togglePreview: "プレビュー切替",
    articleMeta: "記事情報",
    tags: "タグ",
    tagsPlaceholder: "タグを入力",
    date: "作成日",
    createTime: "作成",
    lastmod: "最終更新",
    updateTime: "更新",

    // Site Settings
    siteTitle: "サイト設定",
    siteDesc: "サイト情報を設定",
    siteTitleLabel: "サイトタイトル",
    siteDescription: "サイト説明",
    siteTheme: "サイトテーマ",
    siteLanguage: "サイト言語",
    copyright: "著作権",
    author: "著者",
    avatar: "アバター",
    favicon: "ファビコン",
    selectImage: "画像を選択",

    // Deploy Settings
    deployTitle: "デプロイ設定",
    deployDesc: "デプロイオプションを設定",
    github: "GitHub",
    cos: "Tencent COS",
    oss: "Alibaba OSS",
    netlify: "Netlify",

    // Deploy Form Descriptions - GitHub
    githubPageTitle: "Github Page",
    githubPageDesc: "GitHub Pagesでサイトをデプロイ",
    repositoryDesc: "GitHubリポジトリのURL",
    emailDesc: "GitHubメールアドレス",
    usernameDesc: "GitHubユーザー名",
    tokenDesc: "GitHubアクセストークン",
    cnameDesc: "GitHub Pagesカスタムドメイン",

    // Deploy Form Descriptions - COS
    cosTitle: "Tencent Cloud COS",
    cosDesc: "Tencent Cloud COSでサイトをデプロイ",
    secretIdDesc: "Tencent Cloud SecretId",
    secretKeyDesc: "Tencent Cloud SecretKey",
    regionDesc: "COSバケットのリージョン",
    bucketDesc: "COSバケット名",

    // Deploy Form Descriptions - OSS
    ossTitle: "Alibaba Cloud OSS",
    ossDesc: "Alibaba Cloud OSSでサイトをデプロイ",
    appIdDesc: "Alibaba Cloudアプリケーション ID",
    ossSecretIdDesc: "Alibaba Cloud SecretId",
    ossSecretKeyDesc: "Alibaba Cloud SecretKey",
    ossRegionDesc: "OSSバケットのリージョン",
    ossBucketDesc: "OSSバケット名",

    // Deploy Form Descriptions - Netlify
    netlifyTitle: "Netlify",
    netlifyDesc: "Netlifyでサイトをデプロイ",
    siteIdDesc: "NetlifyサイトID",
    netlifyTokenDesc: "Netlifyアクセストークン",

    // Themes
    warmSepia: "ウォームセピア",
    warmSepiaDesc: "温かみのあるベージュテーマ",
    coolSlate: "クールスレート",
    coolSlateDesc: "クールなグレーブルーテーマ",
    softRose: "ソフトローズ",
    softRoseDesc: "柔らかいローズピンクテーマ",
    freshEmerald: "フレッシュエメラルド",
    freshEmeraldDesc: "爽やかなエメラルドグリーンテーマ",
    deepViolet: "ディープバイオレット",
    deepVioletDesc: "深いバイオレットテーマ",
    pureWhite: "ピュアホワイト",
    pureWhiteDesc: "白い背景とニュートラルな操作ボタン",
    neutralGray: "ニュートラルグレー",
    neutralGrayDesc: "明るいコンテンツ領域を備えたライトグレーの背景",

    // Messages
    deleteConfirm: "削除しますか？",
    deleteSuccess: "正常に削除されました",
    saveSuccess: "正常に保存されました",
    deploySuccess: "正常にデプロイされました",
    error: "エラー",

    // Error Handling & Logs
    errorOccurred: "エラーが発生しました",
    errorDescription: "アプリケーションでエラーが発生しました。ページを更新してください。",
    errorStack: "詳細を表示",
    refreshPage: "ページを更新",
    openLogDir: "ログフォルダを開く",
    openLogDirFailed: "ログフォルダを開けませんでした",
    logSettings: "ログ設定",
    logSettingsDesc: "トラブルシューティング用のアプリケーションログを表示",
    logDir: "ログフォルダ",
    logDirNotFound: "ログフォルダが見つかりません",
    logDirHint: "ログファイルは日別に保存され、過去7日間保持されます",
  },
};

// 当前语言
let currentLanguage = "zh-CN";
const languageListeners = new Set();
export function subscribeLanguage(listener) {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

// 设置语言
export function setLanguage(lang) {
  if (translations[lang]) {
    const changed = currentLanguage !== lang;
    currentLanguage = lang;
    // 保存到 localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", lang);
    }
    if (changed) languageListeners.forEach((listener) => listener());
  }
}

// 获取翻译
export function t(key) {
  const lang = translations[currentLanguage];
  return lang && lang[key] ? lang[key] : key;
}

// 获取当前语言
export function getCurrentLanguage() {
  return currentLanguage;
}

// 初始化语言（从配置或 localStorage 加载）
export async function initializeLanguage() {
  try {
    // 先尝试从 localStorage 加载
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app-language");
      if (savedLang && translations[savedLang]) {
        setLanguage(savedLang);
        return;
      }
    }

    // 然后尝试从后端配置加载
    const { ConfGet } = await import("/wailsjs/go/backend/App");
    const result = await ConfGet("app");

    if (result.code === 1 && result.data && result.data.language) {
      setLanguage(result.data.language);
    }
  } catch (error) {
    console.warn("Failed to load language from config:", error);
  }
}

// 语言选项
export const LANGUAGES = [
  { code: "zh-CN", name: "简体中文", nativeName: "简体中文" },
  { code: "zh-TW", name: "繁體中文", nativeName: "繁體中文" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "ja", name: "日本語", nativeName: "日本語" },
];
