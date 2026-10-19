# Hugo 集成修复与升级

2026-10-19。采用用户确认的方案：保留进程内 Go package 集成，将 Hugo 从 v0.126.1 升级至 v0.168.0，通过独立适配文件控制升级影响。

## 故障与修复

实际站点配置中的 `theme` 为空，界面却显示 mini，旧构建器于是拼出了 `themes/static`。现在启动时会为这种旧配置恢复 mini，保存时验证已安装主题；原配置先保存为 `.pre-hugo-0.168.bak`。原先配置中的绝对 workingDir 若与实际站点不符，也会修正并备份。

旧实现还存在以下问题，已在本次修复：

- 直接复制单个主题的 static，遗漏站点静态文件及 Hugo 模块挂载的合并规则。现在同步 Hugo 的合并静态文件系统，站点文件覆盖同名主题文件。
- 没有关闭 HugoSites。现在每次构建都关闭相关资源。
- 多次构建会争用输出目录。现在串行构建，在同一文件系统的临时目录生成成功后再切换 public；生成失败保留旧 public。切换失败会尝试恢复旧目录。
- 预览先报告启动成功，再异步监听端口。现在先绑定本地 127.0.0.1:1313，端口被占用时同步返回错误。
- 预览共用全局 HTTP mux，关闭后复用失效的 Server。现在每次启动独立服务，支持关闭后重开，退出应用时关闭服务。
- 旧主题使用已移除的 Site 字段、内部模板调用和 404 分页。已更新内置 mini、Jane 模板；已有主题仅在文件哈希与旧内置原版一致时迁移，并逐文件备份。自定义文件不覆盖，因此自定义旧模板仍可能需要用户适配。

输出切换只保护应用自带预览服务的请求；外部程序直接读取 public 不参与应用内锁。保留旧输出需要额外磁盘空间。

## 将 Hugo 作为 Go package 使用的取舍

这种方式可以工作，但调用 `HugoSites.Build` 并不等于完整执行 Hugo CLI。官方 CLI 还会单独同步静态文件。项目原先只实现了部分构建流程，因此出现了资源处理差异。相关调用现在集中在 `backend/hugo_engine.go`。

直接依赖 hugolib、allconfig 等实现包，需要在版本升级时重新验证接口和生命周期；本次升级还推动 Go 最低版本至 1.27，并升级了共享的 AWS、Azure、go-git 等依赖。全项目编译可验证类型兼容，但不代替云服务的真实部署验证。

Jane 的 SCSS 依赖 Hugo Extended 和 CGO，Wails 配置及 CI 已启用 `extended` 标签。当前 libsass 仍可使用，但 Hugo 已提示弃用。后续应迁移 Dart Sass，或预编译并随主题分发 CSS；前者需要管理 Sass 可执行文件，后者需要约定主题自定义 SCSS 的处理方式。

长期建议评估随应用捆绑固定版本的 Hugo Extended 可执行文件，通过子进程构建。这样可以隔离 Hugo 的依赖和运行状态，也更接近官方 CLI 行为；代价是多平台二进制分发、签名、子进程取消及版本管理。本次未进行这项迁移。

目前预览采用“构建后静态服务”，没有文件监听及浏览器自动刷新。再次点击预览会重新构建；不要把它当成完整的 `hugo server`。

## 验证与维护

运行 `go test -tags extended ./backend` 验证 mini/Jane 构建、站点静态资源覆盖、无主题 static 目录、失败时保留旧输出、配置验证和修复、主题迁移保护、预览端口冲突及关闭后重开。测试均使用临时目录。

`SWALLOW_TEST_SITE` 仅可传入可丢弃的站点副本，执行真实旧站点迁移与构建测试；它会写入该副本。

全项目编译验证：`go test -tags extended ./... -run '^$'`。发布构建：`wails build -tags extended`。CI 通过 go.mod 选择 Go 版本。当前只在本机 macOS arm64 验证，Windows 与 macOS universal 需要由 CI 验证。

原始配置和模板备份可供回滚使用。恢复备份应在退出应用并恢复旧应用版本之后进行，防止新版启动再次迁移。文章内容不在迁移范围内。

参考：[v0.168.0 发布说明](https://github.com/gohugoio/hugo/releases/tag/v0.168.0)、[Hugo CLI 构建及静态资源同步实现](https://github.com/gohugoio/hugo/blob/v0.168.0/commands/hugobuilder.go)、[Hugo go.mod](https://github.com/gohugoio/hugo/blob/v0.168.0/go.mod)。
