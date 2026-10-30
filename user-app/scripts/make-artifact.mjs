// dist-demo/index.html（1ファイルにまとめたビルド）から、デモURL（claude.ai の Artifact）に載せる HTML を作る。
// - Artifact は <html><head><body> を自動でつけるので、中身だけを書き出す
// - React は cdnjs の UMD 版（バージョン固定）を読み込む
// - スマホの安全な余白は Artifact 側が :root につけるので、standalone 用の指定は外す
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const REACT_VERSION = '18.3.1';
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs';

const built = readFileSync('dist-demo/index.html', 'utf8');

const pick = (re, label) => {
  const m = built.match(re);
  if (!m) throw new Error(`${label} が見つかりません`);
  return m;
};

const fontsHref = pick(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/, 'Google Fonts')[1];
const styles = [...built.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const appStyle = styles.filter((css) => !css.includes('safe-area-inset-top, 0px);\n        padding-bottom')).join('\n');
const appScript = pick(/<script[^>]*>([\s\S]*?)<\/script>/, 'アプリのスクリプト')[1];

const page = `<title>歩歩 試作デモ</title>
<meta name="description" content="歩歩〜HoHo〜 利用者アプリの はじめての設定とログイン（試作）">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontsHref}">
<style>
${appStyle}
</style>
<div id="root"></div>
<script src="${CDN}/react/${REACT_VERSION}/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="${CDN}/react-dom/${REACT_VERSION}/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
<script>
${appScript.replace(/<\/script/gi, '<\\/script')}
</script>
`;

mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/hoho-demo.html', page);

// 手元のブラウザで そのまま開ける版（Artifact の外枠と同じ指定をつける）
writeFileSync(
  'artifact/hoho-demo.standalone.html',
  `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
${page.replace('<div id="root"></div>', '</head>\n<body>\n<div id="root"></div>')}
</body>
</html>
`,
);

console.log(`artifact/hoho-demo.html ${(page.length / 1024).toFixed(0)} KB`);
