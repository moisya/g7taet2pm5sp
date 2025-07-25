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

// ハイブリッドアプローチ: Gemini API + Google Cloud Text-to-Speech API
async function generateSpeechWithGemini(apiKey, text, voice, style) {
    try {
        // Step 1: Gemini APIでテキストを最適化・処理
        let processedText = text;
        
        if (style && style.trim()) {
            processedText = await optimizeTextWithGemini(apiKey, text, style);
        }
        
        // Step 2: Google Cloud Text-to-Speech APIで音声生成
        await generateSpeechWithTTS(apiKey, processedText, voice);
        
    } catch (error) {
        console.error('Speech generation error:', error);
        throw error;
    }
}

// Gemini APIでテキストを最適化する関数
async function optimizeTextWithGemini(apiKey, text, style) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `以下のテキストを「${style}」というスタイルで読み上げるのに適するよう、自然で読みやすく調整してください。元の意味は変えずに、読み上げに適した形に整えてください。

元のテキスト: ${text}

調整後のテキスト:`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
        }
    };
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        console.warn('Geminiでのテキスト最適化に失敗、元のテキストを使用します');
        return text;
    }
    
    const data = await response.json();
    const optimizedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return optimizedText || text;
}

// Google Cloud Text-to-Speech APIで音声生成
async function generateSpeechWithTTS(apiKey, text, voice) {
    const apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    const requestBody = {
        input: { text: text },
        voice: {
            languageCode: 'ja-JP',
            name: voice,
            ssmlGender: voice.includes('B') || voice.includes('A') ? 'FEMALE' : 'MALE'
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0
        }
    };
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.audioContent) {
        throw new Error('音声データが返されませんでした');
    }
    
    // Base64デコードしてBlobに変換
    const audioBytes = atob(data.audioContent);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
    }
    
    const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
    showAudioSection(audioBlob);
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