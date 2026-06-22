# RenameTab

[English](README.md) · [中文](README_CN.md)

RenameTab 是一个小巧的 Chrome 扩展，用于重命名你当前正在看的标签页标题。打开弹窗或按快捷键，输入一个更好记的名字，回车，标签页标题就地更新。

它适合仪表盘、超长文档页、预发布环境、AI 对话、工单列表，以及任何「原始标题不是你脑子里实际叫法」的标签页。

## 功能

- 用键盘快捷键重命名当前标签页。
- 聚焦的行内输入框，回车应用、Esc 取消。
- 基于 Chrome 原生、可自定义的快捷键。
- 三种标题保持策略：

| 策略 | 行为 |
| --- | --- |
| 标签页关闭前保持 | 自定义标题在刷新和跳转后依然保留，直到该标签页关闭。 |
| URL 不变时保持 | 自定义标题在同一 URL 刷新时保留，URL 改变时清除。 |
| 刷新后恢复 | 自定义标题只对当前这次页面加载生效。 |

## 安装

### 加载已解压的扩展（推荐，本地使用）

无需构建，扩展直接从源码加载。

1. 克隆或下载本仓库。
2. 在 Chrome 中打开 `chrome://extensions`。
3. 打开右上角的 **开发者模式**。
4. 点击左上角 **加载已解压的扩展程序**，选择项目文件夹（即包含 `manifest.json` 的那个目录）。
5. 列表中出现 RenameTab 即安装成功。建议从工具栏的拼图图标把它固定，方便随时使用。

安装后，用默认快捷键 **`Alt+R`**（macOS 上为 `Option+R`）重命名当前标签页，或点击工具栏图标。若 Chrome 因冲突未设置快捷键，可在 `chrome://extensions/shortcuts` 手动指定。

后续更新：拉取最新代码后，点击 RenameTab 卡片上的 **刷新** 图标即可。

### 通过打包的 zip 安装

1. 运行 `npm run package` 构建 zip（生成 `dist/RenameTab.zip`）。
2. 打开 `chrome://extensions` 并开启 **开发者模式**。
3. 把 `dist/RenameTab.zip` 拖到页面上。如果你的 Chrome 不接受 zip 形式的扩展，解压后用 **加载已解压的扩展程序** 选择解压出的文件夹。

## 使用

默认快捷键为 `Alt+R`（macOS 上为 `Option+R`）。

当该组合键已被占用或与其他扩展冲突时，Chrome 可能会把快捷键留空。要设置或修改，打开 `chrome://extensions/shortcuts` 编辑 RenameTab 命令。

你可以在扩展弹窗或选项页中切换标题保持策略。

提交空标题会清除当前标签页的自定义标题。

## 构建

```powershell
npm test
npm run package
```

package 命令会生成 `dist/RenameTab.zip`。

## 隐私

RenameTab 不收集任何统计数据、不发送网络请求、不存储浏览历史。它只在 Chrome 扩展存储中保存：你输入的标题、所选策略需要的标签页 URL，以及你的默认策略设置。
