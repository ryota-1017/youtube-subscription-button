# 引き継ぎ書：YouTube Subscription Button（Chrome 拡張機能）

別の Google アカウント / Chrome プロファイル、または別の PC 環境でも同じ拡張機能をそのまま導入・運用・保守するための引き継ぎドキュメントです。

---

## 1. 拡張機能の概要

- **拡張機能名**: `YouTube Subscription Button`
- **バージョン**: `1.1.0`（Manifest V3）
- **対象サイト**: `https://www.youtube.com/*`
- **機能**: YouTube ヘッダー右上の「マイアカウント（`#avatar-btn`）」アイコンのすぐ左側に、「登録チャンネル（`https://www.youtube.com/feed/subscriptions`）」へ移動するボタンを追加します。
- **GitHub リポジトリ**: https://github.com/ryota-1017/youtube-subscription-button （`main` ブランチ）

---

## 2. 別アカウントへの導入手順

### パターン A：同じ PC の別 Chrome プロファイル（別アカウント）で使う場合
すでにローカルに拡張機能フォルダがあるため、再ダウンロードは不要です。

1. 切り替え先のアカウント（Chrome プロファイル）でブラウザを開きます。
2. アドレスバーに `chrome://extensions/` と入力して拡張機能管理画面を開きます。
3. 右上の **「デベロッパー モード」** をオンにします。
4. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックします。
5. フォルダ選択画面で `c:\Users\ryota\Downloads\my-extension` を選択します。
6. `https://www.youtube.com/` を開き、右上のマイアカウントのすぐ左側に人物アイコンが表示され、クリックで登録チャンネルへ移動できることを確認します。

> **ヒント**: 同じフォルダを参照するため、今後ファイルを更新した際は各プロファイルの `chrome://extensions/` で **再読み込みボタン（丸い矢印）** を押すだけで反映されます。

### パターン B：別の PC・新しい環境で使う場合
GitHub からファイル一式を取得して読み込みます。

- **ZIP で取得する場合**:
  1. https://github.com/ryota-1017/youtube-subscription-button を開きます。
  2. **「Code」→「Download ZIP」** をクリックし、ダウンロードした ZIP を任意の場所に解凍します。
  3. 解凍したフォルダを上記手順 2〜6 と同様に `chrome://extensions/` から読み込みます。
- **Git で取得する場合**:
  ```bash
  git clone https://github.com/ryota-1017/youtube-subscription-button.git
  ```
  クローンされたフォルダを `chrome://extensions/` から読み込みます。

---

## 3. ファイル構成と役割

```text
my-extension/
 ├─ manifest.json      # 拡張機能の設定（Manifest V3・対象URL・CSS/JS指定）
 ├─ content_script.js  # ボタン生成・配置位置調整・SPA監視・重複防止
 ├─ styles.css         # ボタンのデザイン（丸型・ホバー効果・テーマ追従）
 ├─ README.md          # 概要と導入手順
 ├─ HANDOVER.md        # 本引き継ぎ書
 ├─ LICENSE            # MIT License
 ├─ .gitignore         # Git 除外設定
 └─ images/
      └─ user_icon.png # 拡張機能一覧用のアイコン画像（128x128 透過PNG）
```

---

## 4. 実装仕様と注意点（今後の引き継ぎ・改修向け）

1. **ページ内アイコンにインライン SVG を使用している理由**
   - コンテンツスクリプトから `chrome.runtime.getURL('images/user_icon.png')` を読み込むと、`Unsafe attempt to load URL chrome-extension://...` エラーが発生するため、ボタン内のアイコンは `content_script.js` 内のインライン SVG（`createIconSvg()`）で描画しています。
   - SVG は `fill="currentColor"` を使用しているため、YouTube のライト／ダークテーマに応じた文字色（`--yt-spec-text-primary`）へ自動で追従します。
   - `images/user_icon.png` は `manifest.json` の `icons`（Chrome 拡張機能管理画面の表示用）として引き続き使用しています。

2. **ボタン配置位置の制御ロジック**
   - `getTargetContainer()` で `ytd-masthead #end #buttons`（または `ytd-masthead #end`）を取得します。
   - `getAccountElement()` で `#avatar-btn` を含む直下要素を特定し、`flex-direction`（`row` / `row-reverse`）と `getBoundingClientRect()` の実座標をチェックして、**視覚的にマイアカウントのすぐ左側**になるよう挿入・補正しています。
   - ボタンは `<a>` タグ（`id="custom-sub-btn"`）のため、通常クリックだけでなく **Ctrl+クリック／中クリックで新しいタブを開く** ことも可能です。

3. **SPA 対策・負荷軽減・重複防止**
   - `MutationObserver` の監視対象は `ytd-masthead` 検出後にヘッダー内部のみへ絞り込み、`requestAnimationFrame` で間引いています。あわせて YouTube 固有の画面遷移イベント `yt-navigate-finish` でもチェックを行います。
   - `document.querySelectorAll('#custom-sub-btn')` により、万が一 2 つ以上作られた場合は余分な要素を削除します。
   - 拡張機能リロード直後の古いタブでエラーが出ないよう、`chrome.runtime?.id` の有効性チェックを入れています。

---

## 5. トラブルシューティング

* **ボタンが表示されない／位置がおかしい場合**
  1. `chrome://extensions/` で拡張機能がオンになっているか確認し、再読み込みボタンを押してください。
  2. YouTube のタブを F5 でリロードしてください。
  3. YouTube 側の仕様変更でヘッダー構造が変わった場合は、`content_script.js` 内のセレクタ（`ytd-masthead #end #buttons` や `#avatar-btn`）を最新の DOM 構造に合わせて修正してください。
* **拡張機能カードに過去のエラーが残っている場合**
  - `chrome://extensions/` の該当拡張機能カードから **「エラー」→「すべてクリア」** をクリックして履歴を消去し、動作を再確認してください。
