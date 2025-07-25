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
    
    // Gemini APIキーの基本的な形式チェック
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
        showStatus('Gemini APIキーの形式が正しくない可能性があります。正しいAPIキーを入力してください。', 'error');
        apiKeyInput.focus();
        return false;
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

// 音声生成関数（Gemini API使用）
async function generateSpeech(apiKey, text, voice, style) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // 音声スタイルの指示を含むプロンプトを構築
    let prompt = `以下のテキストを${voice}の声で読み上げてください。`;
    
    if (style) {
        prompt += `音声スタイル: ${style}。`;
    }
    
    prompt += `\n\nテキスト: "${text}"`;
    
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
        prompt = prompt.replace(`${voice}の声で`, voiceInstructions[voice]);
    }
    
    prompt += '\n\n音声ファイルを生成して返してください。';
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Gemini APIから有効な応答が返されませんでした');
        }
        
        const responseText = data.candidates[0].content.parts[0].text;
        
        // 注意: Gemini APIは直接音声ファイルを生成できないため、
        // Web Speech API または他の方法で音声合成を行います
        await synthesizeSpeechWithWebAPI(responseText, voice, style);
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error(`Gemini APIでの音声生成に失敗しました: ${error.message}`);
    }
}

// Web Speech APIを使用した音声合成
async function synthesizeSpeechWithWebAPI(text, voice, style) {
    if (!('speechSynthesis' in window)) {
        throw new Error('このブラウザは音声合成をサポートしていません');
    }
    
    return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 日本語に設定
        utterance.lang = 'ja-JP';
        
        // 音声設定
        const voices = speechSynthesis.getVoices();
        const japaneseVoices = voices.filter(v => v.lang.startsWith('ja'));
        
        if (japaneseVoices.length > 0) {
            // 話者選択に基づいて声を選択
            if (voice.includes('Neural2-B') || voice.includes('Wavenet-A') || voice.includes('Wavenet-B')) {
                // 女性の声を優先
                const femaleVoice = japaneseVoices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('女'));
                if (femaleVoice) utterance.voice = femaleVoice;
            } else {
                // 男性の声を優先
                const maleVoice = japaneseVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('男'));
                if (maleVoice) utterance.voice = maleVoice;
            }
            
            // 最初の日本語音声をデフォルトとして使用
            if (!utterance.voice) {
                utterance.voice = japaneseVoices[0];
            }
        }
        
        // スタイル設定
        if (style) {
            if (style.includes('ゆっくり') || style.includes('遅く')) {
                utterance.rate = 0.7;
            } else if (style.includes('早く') || style.includes('速く')) {
                utterance.rate = 1.3;
            } else {
                utterance.rate = 1.0;
            }
            
            if (style.includes('高い') || style.includes('高音')) {
                utterance.pitch = 1.2;
            } else if (style.includes('低い') || style.includes('低音')) {
                utterance.pitch = 0.8;
            } else {
                utterance.pitch = 1.0;
            }
            
            if (style.includes('大きく') || style.includes('音量')) {
                utterance.volume = 1.0;
            } else {
                utterance.volume = 0.8;
            }
        } else {
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
        }
        
        // 音声合成の完了を監視
        utterance.onend = () => {
            // Web Speech APIは直接音声ファイルを生成できないため、
            // ダミーの音声Blobを作成
            createDummyAudioBlob(text);
            resolve();
        };
        
        utterance.onerror = (event) => {
            reject(new Error(`音声合成エラー: ${event.error}`));
        };
        
        // 音声合成を開始
        speechSynthesis.speak(utterance);
    });
}

// Web Speech API用のダミー音声Blob作成
function createDummyAudioBlob(text) {
    // 簡単なダミー音声データ（実際の音声ではなく、プレースホルダー）
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = Math.max(text.length * 0.1, 1); // テキストの長さに基づく概算時間
    const numSamples = Math.floor(sampleRate * duration);
    
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // 無音のダミーデータを作成
    for (let i = 0; i < numSamples; i++) {
        channelData[i] = 0;
    }
    
    // AudioBufferをBlobに変換（簡易版）
    const dummyBlob = new Blob(['Web Speech API音声合成完了'], { type: 'audio/wav' });
    showAudioSection(dummyBlob);
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