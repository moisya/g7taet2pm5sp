# Gemini TTS フロントエンドアプリケーション

Google Gemini 2.5 Flash TTS機能を使用した最新の高品質テキスト読み上げアプリケーションです。

## 特徴

- **最新のGemini 2.5 Flash TTS**: Googleの最新音声合成技術
- **BYOKモデル**: ユーザーが自身のGemini APIキーを使用
- **静的サイト**: サーバー不要で動作
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **多彩な音声キャラクター**: Kore, Charon, Fenrir, Aoede, Puckなど
- **音声スタイル制御**: 自然言語での詳細な音声調整
- **高品質音声**: 24kHz WAVファイル出力

## 機能

### 基本機能
- Gemini APIキー入力（セキュアな入力）
- テキスト入力（最大5000文字）
- 音声キャラクター選択（5種類）
- 音声スタイル指定（自然言語）
- 音声生成・再生
- WAVファイルダウンロード（24kHz高品質）

### 対応音声キャラクター
- **Kore** (女性・優しい声)
- **Charon** (男性・落ち着いた声)
- **Fenrir** (男性・力強い声)
- **Aoede** (女性・明るい声)
- **Puck** (中性・特徴的な声)

## 使用方法

### 1. Gemini APIキーの取得
1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」からAPIキーを作成・取得
4. Gemini 2.5 Flash TTS機能が有効なAPIキーを使用

### 2. アプリケーションの使用
1. Gemini APIキーを入力
2. 読み上げたいテキストを入力
3. 音声キャラクターを選択
4. （任意）音声スタイルを指定
5. 「音声を生成」ボタンをクリック
6. 生成された高品質音声を再生・ダウンロード

### 音声スタイル指定例
- 「ゆっくり話して」→ "Say slowly"
- 「感情豊かに読んで」→ "Say with emotion"  
- 「明るく話して」→ "Say cheerfully"
- 「優しく読み上げて」→ "Say gently"
- 「丁寧に話して」→ "Say politely"

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
- Google Gemini 2.5 Flash TTS API

### 対応ブラウザ
- Google Chrome (推奨)
- Mozilla Firefox
- Microsoft Edge
- Safari

### 技術仕様詳細
- **APIエンドポイント**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`
- **音声フォーマット**: PCM → WAV変換（24kHz, 16bit, モノラル）
- **最大テキスト長**: 5000文字
- **対応音声キャラクター**: 5種類（Kore, Charon, Fenrir, Aoede, Puck）
- **スタイル制御**: 自然言語による音声調整

## セキュリティ

- APIキーはブラウザのメモリ上でのみ保持
- サーバーへの送信・保存は一切行われません
- HTTPSでの通信を前提

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 注意事項

- Gemini 2.5 Flash TTS APIの使用には料金が発生する場合があります
- APIキーの管理は自己責任で行ってください
- 大量のリクエストによるクォータ制限にご注意ください
- Gemini 2.5 Flash TTS機能は preview版のため、仕様変更の可能性があります
- 生成される音声ファイルは24kHz WAV形式です

## トラブルシューティング

### よくある問題

**APIキーエラー**
- APIキーの形式を確認（AIzaで始まる39文字程度）
- Gemini 2.5 Flash TTS機能が有効になっているか確認
- APIキーの権限設定を確認

**「リクエストが無効です」エラー**
- ブラウザの開発者ツール（F12）でConsoleタブを確認
- 送信されるリクエストボディを確認
- APIエンドポイントのURLを確認

**CORS エラー**
- HTTPSでのアクセスを確認
- ブラウザの設定を確認

**音声が生成されない**
- ネットワーク接続を確認
- Gemini APIクォータの残量を確認
- 入力テキストの長さを確認（5000文字以内）
- 音声キャラクター（Kore, Charon等）が正しく選択されているか確認

## 開発者向け情報

### ファイル構成
```
gemini-tts-app/
├── index.html          # メインHTML（UI定義）
├── style.css           # スタイルシート（レスポンシブデザイン）
├── script.js           # Gemini 2.5 TTS連携JavaScript
└── README.md           # ドキュメント
```

### カスタマイズ
- `style.css`: UI/UXデザインの変更
- `script.js`: Gemini API連携ロジックの修正
- `index.html`: 音声キャラクター選択肢の追加
- 音声キャラクター追加: `voiceMapping`オブジェクトを編集

## 貢献

バグ報告や機能要望は、GitHubのIssuesでお願いします。

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>