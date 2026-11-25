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

## Android app (Capacitor)

既存のWeb/PWA版と同じVue/Vite+/Vizeソースコードから、Capacitor 8を使ってAndroidアプリをビルドできます。Android版はルートパス（`base: '/'`）で生成したローカル成果物（`dist/`）を同梱して起動します。

### 必要なローカル開発環境

- Node.js 24（Vite+で管理）および `vp` CLI
- JDK 21
- Android Studio（Otter 2025.2.1以降推奨）および Android SDK（`compileSdk` / `targetSdk`: API 36、`minSdk`: API 24）

### ビルド・同期コマンド

```sh
vp install --frozen-lockfile
vp run build:android     # Android向けに base=/ で dist/ を生成
vp run android:sync      # build:android 実行後、android/ へ資産と設定を同期
vp run android:open      # Android Studio で android/ を開く
vp run android:apk:debug # 同期から Debug APK 生成までまとめて実行
```

生成されるDebug APKの出力先は `android/app/build/outputs/apk/debug/app-debug.apk` です。

### 実機・エミュレーターへのインストール

- **Android Studio**: `vp run android:open` でプロジェクトを開き、実機またはエミュレーターを選んで実行します。
- **adb**: USBデバッグを有効にした端末を接続し、生成したAPKをインストールします。

```sh
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### GitHub ActionsからのDebug APK取得

`.github/workflows/build-android.yml` は、Pull Request・`main`へのpush・手動実行（`workflow_dispatch`）でWeb側の検証・テストとAndroid Debug APKのビルドを実行します（PRからGitHub Pagesへのデプロイは行いません）。

1. GitHubリポジトリの **Actions → Build Android Debug APK** から対象の実行結果を開きます。
2. 画面下部の **Artifacts** から `qremi-android-debug` をダウンロードし、展開して `app-debug.apk` を取得します（保持期間30日）。
3. 実機でインストールする場合は、`adb install app-debug.apk` を実行するか、端末側で提供元不明アプリのインストールを許可してAPKを開きます。

> [!NOTE]
> Debug APKはビルド環境ごとに自動生成されるDebug鍵で署名されます。GitHub Actionsの実行ごと、またはローカルビルドとCIビルドの間では署名が一致しないため、そのまま上書きインストールできません。別の環境・実行で生成したDebug APKを入れ直す場合は、先に端末から既存のQremiをアンインストールしてからインストールしてください。

### 現在のAndroid WebView上の制約

- 現段階ではWeb版と共通の実装を使用しており、PNG/SVG保存はブラウザ標準のBlobダウンロード（`<a download>`）のままです。Android WebView上では保存先の扱いや共有体験に制約があるため、ネイティブ保存・共有プラグインの導入は後続Issueで対応します。
- フォント（Google Fonts）の読み込みはオンライン時のみ適用され、オフライン起動時は端末の標準フォントにフォールバックします。QR生成・編集・検証・保存自体はオフラインで動作します。
