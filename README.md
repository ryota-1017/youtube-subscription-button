# YouTube Subscription Button

YouTube のヘッダー右上（通知アイコン等の左側）に「登録チャンネル（`https://www.youtube.com/feed/subscriptions`）」へのショートカットボタンを追加する Chrome 拡張機能（Manifest V3）です。

## フォルダ構成

```text
my-extension/
 ├─ manifest.json
 ├─ content_script.js
 ├─ styles.css
 ├─ README.md
 └─ images/
      └─ user_icon.png   ← ご用意いただいたアイコン画像を配置してください
```

※ `images/user_icon.png` が未配置の場合でも、フォールバック用の人物シルエット SVG アイコンが表示されます。

## 主な改善点（v1.1.0）

- **高速な遷移・操作性**: `<a>` タグを使用し、通常のクリックだけでなく Ctrl+クリック / 中クリックで新しいタブでも開けるようになりました。
- **軽量な SPA 監視**: `requestAnimationFrame` による間引きと、`ytd-masthead` への監視範囲限定および `yt-navigate-finish` イベントの併用でブラウザ負荷を抑えています。
- **CSS 分離・テーマ対応**: スタイルを `styles.css` に分離し、YouTube 標準のホバーエフェクトやライト / ダークテーマに対応しました。
- **エラー・アクセシビリティ対策**: `title` / `aria-label` の付与、拡張機能リロード時のコンテキスト無効化チェックを追加しました。

## インストール手順

1. `images/user_icon.png` を配置します（任意・未配置時は内蔵SVGを使用）。
2. Chrome で `chrome://extensions/` を開きます。
3. 右上の **「デベロッパー モード」** をオンにします。
4. **「パッケージ化されていない拡張機能を読み込む」** から `my-extension` フォルダを選択します。
5. YouTube（`https://www.youtube.com/`）を開いて確認してください。

## 免責事項

本拡張機能は個人制作の非公式ツールであり、YouTube および Google LLC とは一切関係ありません。

