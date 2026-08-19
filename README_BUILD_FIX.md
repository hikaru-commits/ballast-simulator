# Ballast Simulator build fix

GitHub Actions の build エラー修正版です。

## 修正内容

1. `tsconfig.node.json`
   - `allowImportingTsExtensions` を削除しました。
   - 現在の TypeScript では、このオプションは `noEmit` または `emitDeclarationOnly` 等と組み合わせる必要があり、Node用tsconfigでbuildを止めていました。

2. `src/vite-env.d.ts`
   - `/// <reference types="vite/client" />` を追加しました。
   - これにより `import './styles.css'` のようなCSS side-effect importをVite/TypeScriptが認識できます。

## 配置方法

ZIPを展開し、VS Codeで開いているプロジェクト直下へコピーしてください。

- `tsconfig.node.json` → 既存ファイルを上書き
- `src/vite-env.d.ts` → 新規追加

その後 PowerShell:

```powershell
npm run build
git add .
git commit -m "Fix TypeScript build for GitHub Pages"
git push origin main
```

GitHub Actions の `Deploy to GitHub Pages` が自動実行されます。
