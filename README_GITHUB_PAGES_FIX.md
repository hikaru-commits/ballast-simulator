# GitHub Pages 修正ファイル

このZIPの中身を、VS Codeで開いている `ballast-simulator` プロジェクト直下へコピーしてください。

配置先:
- `vite.config.ts` → プロジェクト直下
- `.github/workflows/deploy.yml` → 同じ階層に `.github/workflows/` を作って配置
- `.gitignore` → プロジェクト直下（既存がある場合は内容を統合）

その後 PowerShell で:

```powershell
npm run build
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

GitHub:
Settings → Pages → Source = GitHub Actions

Actionsタブで `Deploy to GitHub Pages` が成功したら:
https://hikaru-commits.github.io/ballast-simulator/
