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
    setupVoiceSelection();
}

// 音声選択UIの設定
function setupVoiceSelection() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const voiceCards = document.querySelectorAll('.voice-card');
    const hiddenSelect = document.getElementById('voice-select');

    // フィルタータブのクリックイベント
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // アクティブタブの切り替え
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;
            
            // カードの表示/非表示
            voiceCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 音声カードのクリックイベント
    voiceCards.forEach(card => {
        card.addEventListener('click', () => {
            // 選択状態の切り替え
            voiceCards.forEach(c => c.setAttribute('data-selected', 'false'));
            card.setAttribute('data-selected', 'true');

            // 隠しselect要素の値を更新
            const voiceName = card.dataset.voice;
            hiddenSelect.innerHTML = `<option value="${voiceName}" selected>${voiceName}</option>`;
            
            console.log('Selected voice:', voiceName);
        });
    });
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

// Gemini 2.5 Flash TTS直接音声生成
async function generateSpeechWithGemini(apiKey, text, voice, style) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    
    // スタイル指示を含むテキストを構築
    let prompt = text;
    if (style && style.trim()) {
        // スタイル指示を自然な形でテキストに組み込む
        const styleInstructions = {
            'ゆっくり': 'Say slowly: ',
            '遅く': 'Say slowly: ',
            '早く': 'Say quickly: ',
            '速く': 'Say quickly: ',
            '優しく': 'Say gently: ',
            '感情豊か': 'Say with emotion: ',
            '明るく': 'Say cheerfully: ',
            '楽しく': 'Say joyfully: ',
            '丁寧': 'Say politely: ',
            '穏やか': 'Say calmly: '
        };
        
        let stylePrefix = '';
        for (const [key, prefix] of Object.entries(styleInstructions)) {
            if (style.includes(key)) {
                stylePrefix = prefix;
                break;
            }
        }
        
        if (stylePrefix) {
            prompt = stylePrefix + text;
        } else {
            prompt = `Say in ${style} style: ${text}`;
        }
    }
    
    // Gemini 2.5 TTS は直接voice名を使用
    const geminiVoice = voice;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: geminiVoice
                    }
                }
            }
        }
    };
    
    try {
        console.log('Sending request to:', apiUrl);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                console.error('API Error Details:', errorData);
                errorMessage = errorData.error?.message || errorMessage;
                
                // 具体的なエラーメッセージを提供
                if (response.status === 400) {
                    errorMessage = `リクエストが無効です: ${errorMessage}`;
                } else if (response.status === 403) {
                    errorMessage = `APIキーが無効または権限がありません: ${errorMessage}`;
                } else if (response.status === 404) {
                    errorMessage = `Gemini 2.5 TTS機能が利用できません。APIキーにTTS機能が有効か確認してください`;
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Gemini 2.5からの音声データを取得
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!audioData) {
            throw new Error('Gemini 2.5 TTSから音声データが返されませんでした');
        }
        
        // PCMデータをWAVに変換してBlobを作成
        const audioBlob = createWavBlob(audioData);
        showAudioSection(audioBlob);
        
    } catch (error) {
        console.error('Gemini 2.5 TTS Error:', error);
        throw new Error(`Gemini 2.5 TTSでの音声生成に失敗しました: ${error.message}`);
    }
}

// PCMデータをWAVファイル形式のBlobに変換
function createWavBlob(base64PCMData) {
    // Base64デコード
    const pcmData = atob(base64PCMData);
    const pcmArray = new Uint8Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
        pcmArray[i] = pcmData.charCodeAt(i);
    }
    
    // WAVヘッダーを作成
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmArray.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const wavBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(wavBuffer);
    
    // WAVヘッダーを書き込み
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
    view.setUint16(32, channels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // PCMデータをコピー
    const wavArray = new Uint8Array(wavBuffer);
    wavArray.set(pcmArray, headerSize);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
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
    a.download = 'gemini-2.5-tts-audio.wav';
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