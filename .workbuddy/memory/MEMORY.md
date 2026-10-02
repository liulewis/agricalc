# agri-tool (agricalc.online) · 项目长期约定

> 详细过程见 `.workbuddy/memory/2026-09-1*.md` 日志；工具用法见 `不上传_更新工具/README.md` 与 `不上传_templates/README.md`。

## 站点形态
纯静态 HTML/CSS/JS PWA，无框架无构建。**855 页**（en/es/fr 各 285，其中 sitemap 收录 283 = 285 − 404 − offline；**计算器 134 个**）。多语言靠**同级目录 + 相同文件名**（`/blog/x.html` ↔ `/es/blog/x.html`）。
- `assets/css/style.css`（老，104KB，零 `:root`）+ `agri-ui.css`（AgriCore 令牌 + `.prose` + `ag-*` 组件）；**加载顺序固定：先 style.css 后 agri-ui.css**。
- `assets/js/common.js`（计算器逻辑 + 主题/收藏/历史/语言切换）与 `agri-ui.js`（移动导航 / TOC / 进度条 / 代码复制）。

### 改内容前必读
1. 正文一律放 `<div class="prose">`，只用语义标签，**不挂 class、不写 `style=`**。
2. 新组件一律 `ag-` 前缀（老 CSS 已有 `.btn/.card/.container/.breadcrumb`）。
3. 图标用内联 SVG，**禁用 emoji**（全站已清零），图标源 `不上传_templates/tools/agri-icons.py`。
4. `<img>` 必须 `alt`+`width`+`height`；一页一个 `<h1>`。
5. 移动菜单契约：`<button data-ag-menu-toggle>` + `<div class="ag-mobile-nav" id="agMobileNav" data-open>`；**工具页/根级页曾长期漏引 agri-ui.js → 手机菜单点不动**，改 header 时先确认。
6. hreflang：en 与 x-default 都指向英文版（不带前缀）。

## 多语言硬约定
新增任何**模版级文案**（页头/页脚/侧栏/CTA/集合页标签/无障碍标签）必须三语齐备，不许硬编码英文：页面构建走 `不上传_templates/tools/migrate-page.py` 的 `CHROME_I18N`；前端注入走 `AG_COPY`（agri-ui.js）。语言切换器**刻意保持三语**，不跟页面语言翻。

## 上线 / 上传约定（2026-09-16）
- **两个「不上传」前缀，上传时都要排除**（`manifest.py --list-upload` 自动认全，最稳）：
  - `不上传_*` = 不上传但要留着用（更新工具 / 模版 / 翻译管线 / 图片母版 / 报告 / `不上传_docx_build` 指南源文件）
  - `删除_*`   = 不上传且可直接删（备份 / 截图 / Chrome 缓存 / 干跑副本 / DOM 转储 / 一次性探针输出），由 `不上传_更新工具/rename-to-delete.py` 打标
  - **用 FTP/rsync/tar 手工排除时两个都要写**，只写一个会把 295MB 传上服务器。
- **绝对不能删/改名**：根目录两个 32 位 hex 名 `.txt`（`222f5adf…`、`65d968c1…`）= IndexNow/GSC 归属验证文件；`.git/`、`.workbuddy/`。
- `不上传_更新工具/`（new-post / update-sitemap / ping-indexnow / manifest / rename-to-delete / _verify_balance / **add-tool** / **update-index** / **update-count**）是**日常更新主力工具**，已用 `!不上传_更新工具/` 加进版本控制防误删。
- 交付清单：**938 个文件 / 33.9 MB** 上传（2026-09-16 新增 3 个计算器后）；3621 个 / 368.5 MB 不上传。`manifest.py` 可随时重算。
- ✅ **2026-09-17 定稿：双仓库结构**。用户把 `不上传_更新工具/`、`不上传_templates/`、`不上传_audit_scan/` 移到了 **`农业站源码/`（agri-tool 的上一级）**，并在那里**新建独立 git 仓库**跟踪（commit `2c308ba`，304 文件）。agri-tool 只剩纯站点本体，已在 `e8b8ce1` 提交对应的 57 条迁出删除。
  - **站点仓库**：`农业站源码\agri-tool\.git` —— 只放要上传的 938 个文件。
  - **工具仓库**：`农业站源码\.git` —— 只放 `不上传_*`，见 `农业站源码\README.md`。
  - ⚠️ 新仓库 `.gitignore` 排除了 `agri-tool/`（**不能嵌套跟踪**）与 `不上传_audit_scan/_img_raw/`（64.6MB PNG 母版，`git add -f` 可加回）。
  - ⚠️ **脚本里 `ROOT = dirname(dirname(__file__))` 全部失效**（ROOT 变成 `农业站源码`）。**已修 7 个主力脚本**（`manifest.py` / `update-sitemap.py` / `ping-indexnow.py` / `new-post.py` / `rename-to-delete.py` / `_verify_balance.py` / `不上传_templates/tools/migrate-tool.py`），统一改用 `_resolve_root()`（env `AGRI_ROOT` → 旧布局 → 新布局同级 `agri-tool/`）。**新写脚本一律复用它。**
    - 最坑的一次：`ping-indexnow.py --recent` 会推出 849 条 `https://agricalc.online/agri-tool/xxx` 这种不存在的 URL —— 不加 `--dry-run` 跑一次就等于向搜索引擎提交整站垃圾 URL。
    - 残留：`不上传_audit_scan/` 下 76 个历史一次性脚本（不参与运行/推送，搁置）。定位用 `不上传_更新工具/_scan_rootbug.py`。
    - ⚠️ **扫描器自己也要验收**：该扫描器初版正则漏了 `os.path.` 前缀，首扫误报「无残留」；报「无问题」时先构造已知坏样本反证一下。
  - ⚠️ **新建仓库先 `git config core.autocrlf false`**——默认 true 会让 git 改动行尾，就是批量改写污染 CRLF 的元凶。
- ⚠️ **加新前缀前先把所有 `startswith("不上传_")` 的地方 `grep` 出来改一遍**：漏一处就会把备份写进 sitemap / 提交给 IndexNow / 当成线上页面体检。2026-09-16 引入 `删除_` 时共修了 6 个脚本。

### 清理口径（用户问"不上传的能不能删"时的标准答案）
**2026-09-16 已执行打标**：可删的 3295 个文件 / 295.0 MB 全部带上 `删除_` 前缀，清单在根目录 `不上传_删除清单_20260916.txt`。
- **A 档 可删 = 所有 `删除_*`（3295 个 / 295.0 MB）**：`*.bak*`(1185 份/37.2MB，`es/ fr/ tools/ assets/ glossary/` 与根目录)、`不上传_audit_scan/` 下的 18 个目录（`_shots`+`shots` 截图 53MB、`_chrome-profile*` 缓存 30MB、`_dry_tool` 干跑 13MB、`_gen` 9MB、`_dump*`/`_view`/`_bakcheck`/`_img_wm`/`probe*`）+ 719 个根级探针输出(148MB)、`删除_seofix-backup-2026091{1,2}/`(2.7MB)。
- **B 档 保留 = 其余 `不上传_*`**：`不上传_audit_scan/` 的 207 个 `.py` 脚本与 `_tr_*` 翻译管线（**`_tr_dict2.json` = 989×2 词条，丢了等于重做翻译**）、`_img_raw/`(33 张 PNG 母版 65MB)、`_fullscan.json|txt`(最新全站扫描)、`不上传_templates/`、`不上传_docx_build/`(Word 指南源文件)、4 份报告、`不上传_更新工具/`。
- **C 档 绝对不能删**：`.git/`、`.workbuddy/`、两个 hex 验证文件。
- ⚠️ **`*.bak*` 从未进过 git**（`git log --diff-filter=A -- "*.bak*"` = 0 条）→ **删了不可恢复**。删除前先跑 `manifest.py` 确认「需要上传」仍是 929 个 / 33.7 MB。
- 删文件：沙箱拒 PowerShell 删；用 Python `os.remove`/`shutil.rmtree`，量大极慢 → `run_in_background`。

## 内容质量门禁（`不上传_templates/tools/`）
`content-lint.py`（`--profile strict` 新页 / `legacy` 存量）、`repair-content.py`（默认 dry-run，`--apply` 写盘留 `.bak-agri`，**必须二进制读写**）、`fix-rules.txt`（人工确认修复）、`whitelist.txt`（声明"本来就是对的"，两工具自动加载）、`selftest-fusion.py`（改规则后必跑）。
**误报入白名单、真损坏入 fix-rules**——两边一分队列就干净。
- `content-lint` 的 `fused_word_suspect` 误报大户：`soil`→"so oil"、`without`→"with out"、西语 `valoración`→"valor raceración"。新页报这类可直接忽略。
- ⚠️ **扫 TODO / FIXME 必须区分大小写**：西语 `todo/Todo`（=所有，如 *todo el año*）满站都是，不区分会一次误报 300+ 条。

## 推送前终检（`不上传_更新工具/_preflight.py`）
七项一把过：两仓库工作区状态、TODO/FIXME、新页资源引用、非 HTML 文件旧计数、sitemap 三件套与磁盘一致性、**全站内联 `<script>` 语法**、临时文件混入。
- JS 语法检查用 `_jscheck.js`（`vm.Script` 单进程批量编译）。**逐文件起 Node 进程会超时**（855 页 × 上千个 script）。
- `sitemap.xml` 是**英文视图合集**（`target = only or "en"`），不是三语合并 —— 别把它当 bug，三语完整清单在 `sitemap_en/es/fr.xml`。

## 全站现状
- **error = 0**。遗留 warning 按策略不动（img_alt_empty 2885 装饰图、desc_len 55、title_len 44、title/desc_dup 各 4）。
- 结构线已收口：561 个缺失 `</div>` 已补、4 文件多余闭合已删；`_verify_div.py` 全过。
- 迁移线已收口：blog+guides 四语言 410 页 + 计算器家族 426 页全部在新模板上。

## 本机工具边界（踩过的坑）
- 托管 Python：`C:\Users\liu\.workbuddy\binaries\python\versions\3.13.12\python.exe`。**别调裸 `python`**（Windows 会命中应用商店别名挂死）。
- **Bash 工具残缺**（无 coreutils：`ls`/`head`/`tail`/`cat`/`echo` 全丢）、**PowerShell stdout 不回显** → 输出重定向到文件再 Read；**win 路径给 uv 要用 `C:\...` 形式**，`/c/...` 不认。
- ⚠️ **别用 `bash -c "python -c \"长文本\""`**：反引号会被当命令替换，中文括号/`(T−5)` 之类触发语法错误。**长文本先 Write 成文件再执行**（追加日志同理，用 Edit 而不是 shell heredoc）。
- ⚠️ **同一文件并行发多处 Edit 会丢改动**（读-改-写竞态）→ **一次改一处，改完回读验证**（本轮又踩一次：3 处 Edit 只落了 1 处）。
- ⚠️ **git 查中文路径必须 `-c core.quotepath=false`**：`git ls-files | grep "^不上传_"` 会因八进制转义**误报为空**，`git check-ignore -v` 同理。曾因此误判"更新工具没进版本库"。
- 沙箱拒绝 PowerShell 删文件；Python `os.remove` 可用，但删大量文件极慢 → `run_in_background`。
- 无头验证：`python -m http.server`（后台）+ 测试页把结果写进 `document.title` + `chrome --headless=new --virtual-time-budget --dump-dom`。**只有 Bash 工具能直调 chrome.exe**。
- 全站扫描约 2~3 分钟，超时会转后台，等通知。

## 判定口径（别用错）
1. **标签平衡按标签分别计数**（`count(<div>)` vs count(`</div>`)），不要用单一深度计数器——未闭合的 `p` 会和多出的 `div` 互相抵消。深度要看**有没有越界**。
2. **JS 功能是否回归** = script 块逐字节一致 + 脚本引用的 id 仍在 + 标签平衡；三者成立就不必逐页开浏览器。
3. 批量改写后必跑：图片引用完整性、URL 可解析、`_verify_div.py`、content-lint。
4. ⚠️ **审计脚本自己也要被验收**（多次踩）：规则过严→大量误报；解包/路径写错→结果恒为空还看着像成功。

## 批量改写的三个高危点
1. **URL 会被词表替换打穿**：词替换必须限定在 `<title>`/`meta description` 内（`re.sub` 分组），或先做 URL 掩码；踩过 `//` 双斜杠、`#x#x` 重复 hash。
2. **`/tools/([a-z-]+)\.webp` 会误配 `cat-soil.webp`** → 正则要带完整目录前缀。
3. **⚠️ 读写模式会改变行尾**：`io.open(p, encoding="utf-8")` 读 + `newline=""` 写 → 站内原本 CRLF 的文件被改成 LF，diff 变成 +437/−437 的纯噪音（一次污染 105 个文件）。
   → **批量改写一律二进制读写**：`open(p,"rb").read().decode("utf-8")` 读、`.encode("utf-8")` 写回；按行处理时先 `eol = "\r\n" if "\r\n" in raw else "\n"`。
   → 事后判据：`git diff --ignore-cr-at-eol --numstat`（437/437 → 2/2 即确认纯行尾）。
4. **内联样式收进类后兜底会接管**：`p:not([style])` 这类 `!important` 兜底会把清掉行内的元素刷成默认色，清理时必须同步补 `--ag-c-text/--ag-c-head/--ag-c-link` 通道。另：`display:none` **永远不能搬进类**（切换脚本靠清空内联来显示）。
