# Qremi

あなたらしいQRコードを。

Vue 3・[Vite+](https://viteplus.dev/)・[Vize](https://vizejs.dev/guide/vite-plus/index.html)で作られた、日本語のQRコード生成アプリです。

## Features

- URL・テキスト（日本語・絵文字・改行）から静的QRコードを作成
- 3つのプリセット、色・グラデーション・ドットや角の形を編集
- PNG・JPEG・WebPのロゴを中央に配置（5MBまで）
- PNG（512・1024・2048px）と、ロゴを埋め込んだSVGをダウンロード
- IndexedDBに前回の内容・デザイン・ロゴを自動保存
- レスポンシブ画面とPWAインストール対応

入力内容やロゴをサーバーに送信せず、ブラウザ内で生成・検証・保存します。読み取り確認は、印刷物やすべての読み取り機器での動作を保証するものではありません。

## Architecture

`src/lib/qr.ts`に編集データ・プリセット・入力検証、`renderer.ts`にSVG/PNG生成と画像の読み戻し、`storage.ts`にIndexedDB保存をまとめています。

生成には`@liquid-js/qr-code-styling`、検証には`qr-scanner`を使用し、どちらも遅延読み込みします。生成ライブラリのpeer依存にNode用の画像処理などが含まれますが、本番配信にはブラウザ用ビルドだけを使用します。

## PWA and hosting

`vp run build`で生成した`dist/`をHTTPSの静的ホスティングに配置してください。ローカル開発と通常のビルドはルート配信が既定です。素材パスはViteの`base`に追従し、manifestの起動先・スコープ・アイコンはmanifestからの相対パスで解決します。

対応ブラウザのインストール機能、iPhone/iPadではSafariの「ホーム画面に追加」を使えます。Service Worker・オフラインキャッシュは導入していません。起動時は通信が必要です。

### GitHub Pages

1. GitHubのリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定します。
2. デプロイ設定を含む変更を`main`へpushします。
3. **Actions → Deploy to GitHub Pages** の完了後、`github-pages`環境に表示される公開URLを開きます。通常は`https://<ユーザー名>.github.io/<リポジトリ名>/`です。

以後は`main`へのpushで自動デプロイします。手動で再デプロイする場合は、**Actions → Deploy to GitHub Pages → Run workflow** でブランチに`main`を選んで実行します。

ワークフローはNode.js 24とVite+をセットアップし、lockfileに固定した依存関係のインストール、チェック、テスト、ビルドを実行します。すべて成功した場合に`dist/`を公開します。公開パスはGitHub Pagesの設定から取得するため、リポジトリ名をコードに固定する必要はありません。

サブディレクトリ配信をローカルで確認するには、ビルドとプレビューに同じ`base`を指定します。

```sh
vp install --frozen-lockfile
vp run build -- --base=/qremi/
vp run preview -- --base=/qremi/
```

表示されたローカルURLの`/qremi/`を開き、画像表示、QR生成・PNG/SVG保存、manifestの起動先とアイコンを確認してください。
