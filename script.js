// DOM要素の取得
const form = document.getElementById('tts-form');
const apiKeyInput = document.getElementById('api-key');
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const voiceStyleInput = document.getElementById('voice-style');
const generateBtn = document.getElementById('generate-btn');
const status = document.getElementById('status');
const audioSection = document.getElementById('audio-section');
const audioPlayer = document.getElementById('audio-player');
const downloadBtn = document.getElementById('download-btn');

// グローバル変数
let currentAudioBlob = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Gemini TTS App initialized');
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    downloadBtn.addEventListener('click', handleDownload);
}

// フォーム送信処理
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    const text = textInput.value.trim();
    const voice = voiceSelect.value;
    const style = voiceStyleInput.value.trim();

    // 入力値の検証
    if (!validateInputs(apiKey, text)) {
        return;
    }

    try {
        setLoadingState(true);
        hideAudioSection();
        showStatus('音声を生成中...', 'loading');
        
        await generateSpeechWithGemini(apiKey, text, voice, style);
        
    } catch (error) {
        console.error('Error generating speech:', error);
        showStatus(getErrorMessage(error), 'error');
        setLoadingState(false);
    }
}

// 入力値の検証
function validateInputs(apiKey, text) {
    if (!apiKey) {
        showStatus('Gemini APIキーを入力してください。', 'error');
        apiKeyInput.focus();
        return false;
    }
    
    if (!text) {
        showStatus('読み上げテキストを入力してください。', 'error');
        textInput.focus();
        return false;
    }
    
    if (text.length > 5000) {
        showStatus('テキストが長すぎます。5000文字以内で入力してください。', 'error');
        textInput.focus();
        return false;
    }
    
    // Gemini APIキーの基本的な形式チェック
    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
        showStatus('Gemini APIキーの形式が正しくない可能性があります。', 'warning');
    }
    
    return true;
}

// エラーメッセージの生成
function getErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('403') || message.includes('permission')) {
        return 'APIキーが無効です。正しいGemini APIキーを確認してください。';
    } else if (message.includes('400') || message.includes('invalid')) {
        return 'リクエストが無効です。入力内容を確認してください。';
    } else if (message.includes('429') || message.includes('quota')) {
        return 'API使用量の上限に達しました。しばらく時間をおいてから再試行してください。';
    } else if (message.includes('network') || message.includes('fetch')) {
        return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    } else if (message.includes('cors')) {
        return 'CORSエラーが発生しました。ブラウザの設定やAPIキーの権限を確認してください。';
    } else {
        return `音声生成中にエラーが発生しました: ${error.message}`;
    }
}

// Gemini APIで音声生成する関数
async function generateSpeechWithGemini(apiKey, text, voice, style) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 音声スタイルの指示を含むプロンプトを構築
    let prompt = `次のテキストを読み上げてください。『${text}』`;
    
    if (style) {
        // 自然言語でのスタイル指示をプロンプトの先頭に追加
        prompt = `${style}。 ${prompt}`;
    }

    // 話者に基づく指示を追加
    const voiceInstructions = {
        'ja-JP-Neural2-B': '女性らしい優しい声で',
        'ja-JP-Neural2-C': '男性らしい落ち着いた声で',
        'ja-JP-Neural2-D': '男性らしい力強い声で',
        'ja-JP-Wavenet-A': '女性らしい明るい声で',
        'ja-JP-Wavenet-B': '女性らしい上品な声で',
        'ja-JP-Wavenet-C': '男性らしい穏やかな声で',
        'ja-JP-Wavenet-D': '男性らしい丁寧な声で'
    };
    
    if (voiceInstructions[voice]) {
        prompt = `${voiceInstructions[voice]}${prompt}`;
    }

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        // 音声ファイル(MP3)を生成するよう指定
        generationConfig: {
            responseMimeType: "audio/mp3"
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // レスポンスから音声データ(Base64)を取り出す
        const audioContent = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioContent) {
            throw new Error('APIから音声データが返されませんでした。Gemini APIの音声生成機能が利用できない可能性があります。');
        }

        // Base64をデコードして、再生・ダウンロード可能なBlobオブジェクトに変換
        const audioBytes = atob(audioContent);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
            audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
        
        // 成功したのでUIに表示
        showAudioSection(audioBlob);
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`Gemini APIでの音声生成に失敗しました: ${error.message}`);
    }
}

// ダウンロード処理
function handleDownload() {
    if (!currentAudioBlob) {
        showStatus('ダウンロードする音声がありません。', 'error');
        return;
    }

    const url = URL.createObjectURL(currentAudioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-tts-audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ステータス表示
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
}

// ローディング状態の制御
function setLoadingState(loading) {
    generateBtn.disabled = loading;
    
    if (loading) {
        generateBtn.innerHTML = '<span class="loading-spinner"></span>生成中...';
    } else {
        generateBtn.innerHTML = '音声を生成';
    }
}

// 音声再生・ダウンロードセクションの表示
function showAudioSection(audioBlob) {
    currentAudioBlob = audioBlob;
    
    const url = URL.createObjectURL(audioBlob);
    audioPlayer.src = url;
    
    audioSection.classList.remove('hidden');
    showStatus('音声生成が完了しました！', 'success');
    setLoadingState(false);
}

// 音声セクションを非表示にする
function hideAudioSection() {
    audioSection.classList.add('hidden');
    if (audioPlayer.src) {
        URL.revokeObjectURL(audioPlayer.src);
        audioPlayer.src = '';
    }
    currentAudioBlob = null;
}

// ステータスを隠す
function hideStatus() {
    status.classList.add('hidden');
}