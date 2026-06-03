# RemarkBook 发布说明

本项目使用 Tauri 的原生打包能力。安装包需要在对应操作系统上构建，所以三平台发布通过 GitHub Actions 完成。

## 自动发布

推送 `v*` 标签会触发 `.github/workflows/release.yml`：

```bash
git tag v0.1.3
git push origin v0.1.3
```

Workflow 会并行构建：

| 平台 | Runner | 主要产物 |
| --- | --- | --- |
| Windows | `windows-latest` | `.msi`, `.exe` |
| macOS | `macos-latest` | `.dmg` |
| Linux | `ubuntu-22.04` | `.AppImage`, `.deb` |

标签构建成功后，产物会发布到 GitHub Releases。

## 手动打包测试

在 GitHub Actions 页面手动运行 `Release` workflow 时，不会创建正式 Release，但会上传 workflow artifacts：

- `remarkbook-windows`
- `remarkbook-macos-universal`
- `remarkbook-linux`

这些 artifacts 可以用于发布前下载安装测试。

## Windows 便携包

在 Windows 本机可以生成便携 zip：

```powershell
npm run package:windows
```

产物：

```text
release/windows/RemarkBook-Windows-Portable.zip
```

便携包包含：

- `RemarkBook.exe`
- `RemarkBook.ico`
- `install.ps1`
- `uninstall.ps1`
- `README.txt`

## 本地当前系统打包

如果只想为当前系统打包：

```bash
npm run tauri:build
```

Tauri 会把安装包输出到：

```text
src-tauri/target/release/bundle/
```
