// 配置数据
const config = {
    speakers: [
        { id: 'S1', name: 'S1', type: 'seen' },
        { id: 'S2', name: 'S2', type: 'seen' },
        { id: 'U1', name: 'U1', type: 'unseen' }
    ],
    emotions: [
        { id: 'N2H', name: 'Neutral-to-Happy', icon: 'fa-smile' },
        { id: 'N2A', name: 'Neutral-to-Angry', icon: 'fa-angry' },
        { id: 'N2S', name: 'Neutral-to-Sad', icon: 'fa-sad-tear' }
    ],
    models: [
        { id: 'neu', name: 'Neutral Reference', tagClass: 'neu', description: '中性参考语音' },
        { id: 'baseline', name: 'Baseline', tagClass: 'baseline', description: '基准模型' },
        { id: 'cnn+bilstm', name: 'CNN+BiLSTM', tagClass: 'cnn-bilstm', description: 'CNN+BiLSTM模型' },
        { id: 'cnn+transformer', name: 'CNN+Transformer', tagClass: 'cnn-transformer', description: 'CNN+Transformer模型' }
    ]
};

// 音频播放器管理器
class AudioPlayerManager {
    constructor() {
        this.currentPlaying = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderAllAudioTables();
    }

    // 渲染所有音频表格
    renderAllAudioTables() {
        config.speakers.forEach(speaker => {
            config.emotions.forEach(emotion => {
                this.renderAudioTable(speaker.id, emotion.id);
            });
        });
    }

    // 渲染音频表格
    renderAudioTable(speaker, emotion) {
        const tableBody = document.querySelector(`#${speaker} .emotion-section:nth-child(${config.emotions.findIndex(e => e.id === emotion) + 1}) tbody`);
        if (!tableBody) return;

        tableBody.innerHTML = '';

        config.models.forEach(model => {
            const audioPath = `audio/${speaker}/${emotion}/${model.id}.wav`;
            const row = this.createAudioRow(speaker, emotion, model, audioPath);
            tableBody.appendChild(row);
        });
    }

    // 创建音频行
    createAudioRow(speaker, emotion, model, audioPath) {
        const row = document.createElement('tr');
        const audioId = `${speaker}-${emotion}-${model.id}`.replace(/[^a-zA-Z0-9-]/g, '');

        row.innerHTML = `
            <td>
                <div class="model-info">
                    <span class="model-tag ${model.tagClass}">${model.name}</span>
                    <div class="model-description">${model.description}</div>
                </div>
            </td>
            <td>
                <div class="audio-info">${speaker}/${emotion}/${model.id}.wav</div>
            </td>
            <td>
                <div class="audio-controls">
                    <div class="audio-player-container">
                        <audio id="${audioId}" class="audio-player" preload="metadata">
                            <source src="${audioPath}" type="audio/wav">
                            您的浏览器不支持audio元素。
                        </audio>
                    </div>
                    <div class="audio-buttons">
                        <button class="audio-btn play-btn" data-audio="${audioId}">
                            <i class="fas fa-play"></i> 播放
                        </button>
                        <button class="audio-btn stop-btn" data-audio="${audioId}">
                            <i class="fas fa-stop"></i> 停止
                        </button>
                    </div>
                </div>
            </td>
            <td>
                <div class="audio-info" id="duration-${audioId}">--:--</div>
            </td>
        `;

        // 设置音频元素
        const audioElement = row.querySelector(`#${audioId}`);
        this.setupAudioElement(audioElement, audioId);

        return row;
    }

    // 设置音频元素
    setupAudioElement(audioElement, audioId) {
        // 加载元数据时获取时长
        audioElement.addEventListener('loadedmetadata', () => {
            const duration = audioElement.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            const durationElement = document.getElementById(`duration-${audioId}`);
            if (durationElement) {
                durationElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        });

        // 播放状态更新
        audioElement.addEventListener('play', () => {
            if (this.currentPlaying && this.currentPlaying !== audioElement) {
                this.currentPlaying.pause();
            }
            this.currentPlaying = audioElement;
            this.updateButtonState(audioId, true);
        });

        audioElement.addEventListener('pause', () => {
            if (this.currentPlaying === audioElement) {
                this.currentPlaying = null;
            }
            this.updateButtonState(audioId, false);
        });

        audioElement.addEventListener('ended', () => {
            this.currentPlaying = null;
            this.updateButtonState(audioId, false);
        });
    }

    // 更新按钮状态
    updateButtonState(audioId, isPlaying) {
        const button = document.querySelector(`[data-audio="${audioId}"] .play-btn`);
        if (button) {
            const icon = button.querySelector('i');
            if (isPlaying) {
                button.classList.add('playing');
                icon.className = 'fas fa-pause';
                button.innerHTML = '<i class="fas fa-pause"></i> 暂停';
            } else {
                button.classList.remove('playing');
                icon.className = 'fas fa-play';
                button.innerHTML = '<i class="fas fa-play"></i> 播放';
            }
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 动态事件委托
        document.addEventListener('click', (e) => {
            // 播放按钮
            if (e.target.closest('.play-btn')) {
                const button = e.target.closest('.play-btn');
                const audioId = button.dataset.audio;
                const audioElement = document.getElementById(audioId);
                
                if (audioElement) {
                    if (audioElement.paused) {
                        audioElement.play();
                    } else {
                        audioElement.pause();
                    }
                }
                e.preventDefault();
            }
            
            // 停止按钮
            if (e.target.closest('.stop-btn')) {
                const button = e.target.closest('.stop-btn');
                const audioId = button.dataset.audio;
                const audioElement = document.getElementById(audioId);
                
                if (audioElement) {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                }
                e.preventDefault();
            }
            
            // 说话人切换
            if (e.target.closest('.speaker-btn')) {
                const button = e.target.closest('.speaker-btn');
                const speaker = button.dataset.speaker;
                this.switchSpeaker(speaker);
                e.preventDefault();
            }
        });

        // 说话人按钮点击
        document.querySelectorAll('.speaker-btn').forEach(button => {
            button.addEventListener('click', () => {
                const speaker = button.dataset.speaker;
                this.switchSpeaker(speaker);
            });
        });

        // 全局音频事件
        document.addEventListener('play', (e) => {
            if (e.target.tagName === 'AUDIO') {
                // 停止其他正在播放的音频
                document.querySelectorAll('audio').forEach(audio => {
                    if (audio !== e.target && !audio.paused) {
                        audio.pause();
                    }
                });
            }
        }, true);
    }

    // 切换说话人
    switchSpeaker(speaker) {
        // 更新按钮状态
        document.querySelectorAll('.speaker-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-speaker="${speaker}"]`).classList.add('active');
        
        // 显示对应的说话人部分
        document.querySelectorAll('.speaker-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(speaker).classList.add('active');
        
        // 停止所有音频
        if (this.currentPlaying) {
            this.currentPlaying.pause();
            this.currentPlaying = null;
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频播放器管理器
    const audioManager = new AudioPlayerManager();
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // 空格键：暂停/播放当前音频
        if (e.code === 'Space' && !e.target.matches('input, textarea, button, audio')) {
            e.preventDefault();
            const audio = audioManager.currentPlaying;
            if (audio) {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        }
        
        // ESC键：停止所有音频
        if (e.code === 'Escape') {
            document.querySelectorAll('audio').forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            audioManager.currentPlaying = null;
        }
    });

    // 显示音频加载状态
    console.log('音频演示系统初始化完成');
    console.log(`配置: ${config.speakers.length}个说话人, ${config.emotions.length}个情感转换方向, ${config.models.length}个模型`);
});
