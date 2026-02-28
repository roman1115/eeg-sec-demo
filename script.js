// 音频数据配置
const audioConfig = {
    speakers: ['S1', 'S2', 'U1'],
    emotions: ['N2H', 'N2A', 'N2S'],
    models: [
        { id: 'neu', name: '中性参考', color: 'neu', icon: 'fas fa-volume-up' },
        { id: 'baseline', name: 'baseline', color: 'baseline', icon: 'fas fa-chart-line' },
        { id: 'cnn+bilstm', name: 'CNN+BiLSTM', color: 'cnn-bilstm', icon: 'fas fa-network-wired' },
        { id: 'cnn+transformer', name: 'CNN+Transformer', color: 'cnn-transformer', icon: 'fas fa-brain' }
    ],
    
    // 获取音频路径
    getAudioPath(speaker, emotion, model) {
        return `audio/${speaker}/${emotion}/${model}.wav`;
    },
    
    // 获取情感名称
    getEmotionName(emotionCode) {
        const emotionNames = {
            'N2H': { zh: '开心', en: 'Happy', icon: 'fas fa-laugh' },
            'N2A': { zh: '生气', en: 'Angry', icon: 'fas fa-angry' },
            'N2S': { zh: '伤心', en: 'Sad', icon: 'fas fa-sad-tear' }
        };
        return emotionNames[emotionCode] || { zh: emotionCode, en: emotionCode };
    }
};

// 音频播放器管理器
class AudioPlayerManager {
    constructor() {
        this.audioElements = new Map(); // 存储所有audio元素
        this.currentPlaying = new Set(); // 当前正在播放的audio
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderAllAudioPlayers();
        this.setupVolumeControl();
    }
    
    // 渲染所有音频播放器
    renderAllAudioPlayers() {
        audioConfig.speakers.forEach(speaker => {
            audioConfig.emotions.forEach(emotion => {
                this.renderAudioPlayersForEmotion(speaker, emotion);
            });
        });
    }
    
    // 为特定情感渲染音频播放器
    renderAudioPlayersForEmotion(speaker, emotion) {
        const emotionGroup = document.querySelector(`#${speaker} .emotion-group:nth-child(${audioConfig.emotions.indexOf(emotion) + 1}) .audio-grid`);
        if (!emotionGroup) return;
        
        emotionGroup.innerHTML = '';
        
        const emotionInfo = audioConfig.getEmotionName(emotion);
        
        audioConfig.models.forEach(model => {
            const audioPath = audioConfig.getAudioPath(speaker, emotion, model.id);
            const audioCard = this.createAudioCard(speaker, emotion, model, audioPath, emotionInfo);
            emotionGroup.appendChild(audioCard);
        });
    }
    
    // 创建音频卡片
    createAudioCard(speaker, emotion, model, audioPath, emotionInfo) {
        const audioCard = document.createElement('div');
        audioCard.className = 'audio-card';
        audioCard.dataset.speaker = speaker;
        audioCard.dataset.emotion = emotion;
        audioCard.dataset.model = model.id;
        
        // 创建唯一的audio元素ID
        const audioId = `${speaker}-${emotion}-${model.id}`.replace(/[^a-zA-Z0-9-]/g, '');
        
        audioCard.innerHTML = `
            <div class="audio-header ${model.color}">
                <div class="audio-info">
                    <h4><i class="${model.icon}"></i> ${model.name}</h4>
                    <div class="audio-model">${speaker} · ${emotionInfo.zh} (${emotionInfo.en})</div>
                </div>
                <div class="audio-status">
                    <span class="status-indicator" id="status-${audioId}">● 准备播放</span>
                </div>
            </div>
            <div class="audio-controls">
                <audio id="${audioId}" preload="metadata">
                    <source src="${audioPath}" type="audio/wav">
                    您的浏览器不支持audio元素。
                </audio>
                <div class="playback-controls">
                    <button class="control-btn play-btn" data-audio="${audioId}">
                        <i class="fas fa-play"></i> 播放
                    </button>
                    <button class="control-btn secondary pause-btn" data-audio="${audioId}">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                </div>
            </div>
            <div class="audio-stats">
                <div class="stat-item">
                    <span class="stat-label">时长</span>
                    <span class="stat-value" id="duration-${audioId}">--:--</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">采样率</span>
                    <span class="stat-value">16kHz</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">格式</span>
                    <span class="stat-value">WAV</span>
                </div>
            </div>
        `;
        
        // 获取audio元素并存储
        const audioElement = audioCard.querySelector(`#${audioId}`);
        this.setupAudioElement(audioElement, audioId);
        this.audioElements.set(audioId, audioElement);
        
        return audioCard;
    }
    
    // 设置audio元素事件监听
    setupAudioElement(audioElement, audioId) {
        // 加载元数据时获取时长
        audioElement.addEventListener('loadedmetadata', () => {
            const duration = audioElement.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            document.getElementById(`duration-${audioId}`).textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });
        
        // 播放状态更新
        audioElement.addEventListener('play', () => {
            this.currentPlaying.add(audioId);
            this.updateAudioStatus(audioId, 'playing');
        });
        
        audioElement.addEventListener('pause', () => {
            this.currentPlaying.delete(audioId);
            this.updateAudioStatus(audioId, 'paused');
        });
        
        audioElement.addEventListener('ended', () => {
            this.currentPlaying.delete(audioId);
            this.updateAudioStatus(audioId, 'ended');
        });
        
        audioElement.addEventListener('error', (e) => {
            console.error(`音频加载错误: ${audioId}`, e);
            this.updateAudioStatus(audioId, 'error');
        });
    }
    
    // 更新音频状态显示
    updateAudioStatus(audioId, status) {
        const statusElement = document.getElementById(`status-${audioId}`);
        if (!statusElement) return;
        
        const statusConfig = {
            'playing': { text: '● 播放中', color: '#2ecc71' },
            'paused': { text: '● 已暂停', color: '#f39c12' },
            'ended': { text: '● 播放完成', color: '#3498db' },
            'error': { text: '● 加载失败', color: '#e74c3c' },
            'default': { text: '● 准备播放', color: '#95a5a6' }
        };
        
        const config = statusConfig[status] || statusConfig['default'];
        statusElement.textContent = config.text;
        statusElement.style.color = config.color;
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 动态事件委托
        document.addEventListener('click', (e) => {
            // 播放按钮
            if (e.target.closest('.play-btn')) {
                const audioId = e.target.closest('.play-btn').dataset.audio;
                this.playAudio(audioId);
                e.preventDefault();
            }
            
            // 暂停按钮
            if (e.target.closest('.pause-btn')) {
                const audioId = e.target.closest('.pause-btn').dataset.audio;
                this.pauseAudio(audioId);
                e.preventDefault();
            }
            
            // 说话人切换
            if (e.target.closest('.speaker-btn')) {
                const speakerBtn = e.target.closest('.speaker-btn');
                const speaker = speakerBtn.dataset.speaker;
                this.switchSpeaker(speaker);
                e.preventDefault();
            }
        });
        
        // 全局控制按钮
        document.getElementById('play-all').addEventListener('click', () => this.playAllVisible());
        document.getElementById('pause-all').addEventListener('click', () => this.pauseAll());
        document.getElementById('stop-all').addEventListener('click', () => this.stopAll());
    }
    
    // 设置音量控制
    setupVolumeControl() {
        const volumeControl = document.getElementById('global-volume');
        volumeControl.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setGlobalVolume(volume);
        });
    }
    
    // 播放单个音频
    playAudio(audioId) {
        this.pauseAll(); // 先暂停所有音频
        
        const audioElement = this.audioElements.get(audioId);
        if (audioElement) {
            // 重置到开始
            audioElement.currentTime = 0;
            audioElement.play().catch(error => {
                console.error('播放失败:', error);
                this.updateAudioStatus(audioId, 'error');
            });
        }
    }
    
    // 暂停音频
    pauseAudio(audioId) {
        const audioElement = this.audioElements.get(audioId);
        if (audioElement) {
            audioElement.pause();
        }
    }
    
    // 播放所有可见的音频
    playAllVisible() {
        this.pauseAll(); // 先暂停所有
        
        const currentSpeaker = document.querySelector('.speaker-section.active').id;
        const audioElements = document.querySelectorAll(`#${currentSpeaker} audio`);
        
        // 逐个播放，间隔1秒
        audioElements.forEach((audio, index) => {
            setTimeout(() => {
                audio.currentTime = 0;
                audio.play().catch(error => {
                    console.error('播放失败:', error);
                });
            }, index * 1000); // 每个音频间隔1秒
        });
    }
    
    // 暂停所有音频
    pauseAll() {
        this.currentPlaying.forEach(audioId => {
            const audioElement = this.audioElements.get(audioId);
            if (audioElement) {
                audioElement.pause();
            }
        });
        this.currentPlaying.clear();
    }
    
    // 停止所有音频
    stopAll() {
        this.currentPlaying.forEach(audioId => {
            const audioElement = this.audioElements.get(audioId);
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
        });
        this.currentPlaying.clear();
        
        // 更新所有状态显示
        this.audioElements.forEach((audio, audioId) => {
            this.updateAudioStatus(audioId, 'default');
        });
    }
    
    // 设置全局音量
    setGlobalVolume(volume) {
        this.audioElements.forEach(audioElement => {
            audioElement.volume = volume;
        });
    }
    
    // 切换说话人
    switchSpeaker(speaker) {
        // 更新按钮状态
        document.querySelectorAll('.speaker-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.speaker-btn').classList.add('active');
        
        // 显示对应的说话人部分
        document.querySelectorAll('.speaker-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(speaker).classList.add('active');
        
        // 暂停所有音频
        this.pauseAll();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频播放器管理器
    const audioManager = new AudioPlayerManager();
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', (e) => {
        // 空格键：播放/暂停当前选中的音频
        if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
            e.preventDefault();
            const activeSection = document.querySelector('.speaker-section.active');
            const firstAudio = activeSection.querySelector('audio');
            if (firstAudio) {
                if (firstAudio.paused) {
                    firstAudio.play();
                } else {
                    audioManager.pauseAll();
                }
            }
        }
        
        // ESC键：停止所有音频
        if (e.code === 'Escape') {
            audioManager.stopAll();
        }
        
        // 数字键1-3切换说话人
        if (e.code >= 'Digit1' && e.code <= 'Digit3') {
            const index = parseInt(e.code.slice(-1)) - 1;
            const speakers = ['S1', 'S2', 'U1'];
            if (speakers[index]) {
                document.querySelector(`[data-speaker="${speakers[index]}"]`).click();
            }
        }
    });
    
    // 添加音频文件存在性检查
    console.log('音频演示系统初始化完成');
    console.log('可用说话人:', audioConfig.speakers);
    console.log('情感转换方向:', audioConfig.emotions);
    console.log('模型对比:', audioConfig.models.map(m => m.name));
    
    // 显示键盘快捷键提示
    const hintElement = document.querySelector('.hint');
    if (hintElement) {
        hintElement.innerHTML += '<br>快捷键: 空格键(播放/暂停) | ESC键(停止) | 数字键1-3(切换说话人)';
    }
});
