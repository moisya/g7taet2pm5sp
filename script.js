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
        
        await generateSpeech(apiKey, text, voice, style);
        
    } catch (error) {
        console.error('Error generating speech:', error);
        showStatus(getErrorMessage(error), 'error');
        setLoadingState(false);
    }
}

// 入力値の検証
function validateInputs(apiKey, text) {
    if (!apiKey) {
        showStatus('Google APIキーを入力してください。', 'error');
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
    
    // APIキーの基本的な形式チェック
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
        showStatus('Google APIキーの形式が正しくない可能性があります。正しいAPIキーを入力してください。', 'error');
        apiKeyInput.focus();
        return false;
    }
    
    return true;
}

// エラーメッセージの生成
function getErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('403') || message.includes('permission')) {
        return 'APIキーが無効です。正しいGoogle Cloud APIキーを確認してください。';
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

// 音声生成関数
async function generateSpeech(apiKey, text, voice, style) {
    const apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    // 音声設定の構築
    let ssmlText = text;
    
    // スタイル指定がある場合、SSMLタグで包む
    if (style) {
        ssmlText = `<speak><prosody rate="medium" pitch="medium">${text}</prosody></speak>`;
        
        // スタイル指定に基づいてSSMLを調整
        if (style.includes('ゆっくり') || style.includes('遅く')) {
            ssmlText = ssmlText.replace('rate="medium"', 'rate="slow"');
        } else if (style.includes('早く') || style.includes('速く')) {
            ssmlText = ssmlText.replace('rate="medium"', 'rate="fast"');
        }
        
        if (style.includes('高い') || style.includes('高音')) {
            ssmlText = ssmlText.replace('pitch="medium"', 'pitch="high"');
        } else if (style.includes('低い') || style.includes('低音')) {
            ssmlText = ssmlText.replace('pitch="medium"', 'pitch="low"');
        }
    }
    
    const requestBody = {
        input: {
            ssml: ssmlText.includes('<speak>') ? ssmlText : undefined,
            text: ssmlText.includes('<speak>') ? undefined : ssmlText
        },
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
    
    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
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
        
        // 音声再生セクションを表示
        showAudioSection(audioBlob);
        
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(`音声生成に失敗しました: ${error.message}`);
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
    a.download = 'generated-speech.mp3';
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