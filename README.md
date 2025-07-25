# Gemini TTS フロントエンドアプリケーション

Google Gemini APIとWeb Speech APIを組み合わせたテキスト読み上げアプリケーションです。

## 特徴

- **BYOKモデル**: ユーザーが自身のGoogle APIキーを使用
- **静的サイト**: サーバー不要で動作
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **多様な音声**: 日本語の複数話者に対応
- **音声スタイル**: 自然言語での音声調整
- **音声ダウンロード**: MP3形式での保存

## 機能

### 基本機能
- Google APIキー入力（セキュアな入力）
- テキスト入力（最大5000文字）
- 話者選択（日本語7種類）
- 音声スタイル指定（任意）
- 音声生成・再生
- MP3ファイルダウンロード

### 対応話者
- 日本語 女性A (Neural2-B)
- 日本語 男性A (Neural2-C)
- 日本語 男性B (Neural2-D)
- 日本語 女性B (Wavenet-A)
- 日本語 女性C (Wavenet-B)
- 日本語 男性C (Wavenet-C)
- 日本語 男性D (Wavenet-D)

## 使用方法

### 1. Gemini APIキーの取得
1. [Google AI Studio](https://makersuite.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」からAPIキーを作成・取得
4. Gemini APIの利用規約に同意

### 2. アプリケーションの使用
1. Gemini APIキーを入力
2. 読み上げたいテキストを入力
3. 話者を選択
4. （任意）音声スタイルを指定
5. 「音声を生成」ボタンをクリック
6. 生成された音声を再生・ダウンロード

### 音声スタイル指定例
- 「ゆっくり話して」
- 「感情豊かに読んで」
- 「高い声で話して」
- 「優しく読み上げて」

## セットアップ

### ローカル環境での実行
```bash
# リポジトリをクローン
git clone <repository-url>
cd gemini-tts-app

# ブラウザでindex.htmlを開く
# （HTTPサーバーでの実行を推奨）
python -m http.server 8000
# または
npx serve .
```

### GitHub Pagesでのデプロイ
1. このリポジトリをGitHubにプッシュ
2. Settings > Pages で Source を "Deploy from a branch" に設定
3. Branch を "main" / "root" に設定
4. 公開URLでアクセス

## 技術仕様

### 使用技術
- HTML5
- CSS3 (Flexbox, CSS Grid, レスポンシブデザイン)
- Vanilla JavaScript (ES6+)
- Google Gemini API
- Web Speech API

### 対応ブラウザ
- Google Chrome (推奨)
- Mozilla Firefox
- Microsoft Edge
- Safari

### APIエンドポイント
- `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

## セキュリティ

- APIキーはブラウザのメモリ上でのみ保持
- サーバーへの送信・保存は一切行われません
- HTTPSでの通信を前提

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 注意事項

- Gemini APIの使用には料金が発生する場合があります（無料枠あり）
- APIキーの管理は自己責任で行ってください
- 大量のリクエストによる制限にご注意ください
- 音声合成にはブラウザのWeb Speech APIを使用するため、ブラウザとOS依存です

## トラブルシューティング

### よくある問題

**APIキーエラー**
- APIキーの形式を確認
- Gemini APIが有効になっているか確認
- APIキーの権限設定を確認

**CORS エラー**
- HTTPSでのアクセスを確認
- ブラウザの設定を確認

**音声が生成されない**
- ネットワーク接続を確認
- APIクォータの残量を確認
- 入力テキストの長さを確認（5000文字以内）

## 開発者向け情報

### ファイル構成
```
gemini-tts-app/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── script.js           # JavaScript機能
└── README.md           # ドキュメント
```

### カスタマイズ
- `style.css`: デザインの変更
- `script.js`: 機能の追加・修正
- `index.html`: UI要素の追加・変更

## 貢献

バグ報告や機能要望は、GitHubのIssuesでお願いします。

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>