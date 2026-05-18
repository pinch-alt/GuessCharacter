/**
 * AI Guessing Game: Who is it?
 * Main Application Logic
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 보안 주의: 여기에 API 키를 직접 넣으면 웹사이트 소스 코드를 보는 누구나 키를 확인할 수 있습니다.
 * 배포 시에는 소스 코드에 키를 노출하지 않는 것이 좋으나, 사용자의 요청에 따라 여기에 미리 연동합니다.
 * 여기에 본인의 '무료 Gemini API 키'를 붙여넣으세요.
 */
const GEMINI_API_KEY = "AIzaSyCccSz48hcFdzjP06QERLm7KZMhNJkawMQ";

// Application State
const state = {
    players: [], // Array of { name: string, traits: string[] }
    currentPhase: 'registration', // registration, trait-entry, guessing
    currentPlayerIndex: 0,
    maxPlayers: 7
};

// DOM Elements
const views = {
    'registration': document.getElementById('registration-view'),
    'trait-entry': document.getElementById('trait-entry-view'),
    'guessing': document.getElementById('guessing-view')
};

const elements = {
    nameInputs: document.querySelectorAll('.player-name-input'),
    startGameBtn: document.getElementById('start-game-btn'),
    currentPlayerTitle: document.getElementById('current-player-title'),
    traitTextarea: document.getElementById('player-traits'),
    nextTraitBtn: document.getElementById('next-trait-btn'),
    prevTraitBtn: document.getElementById('prev-trait-btn'),
    playerStatusList: document.getElementById('player-status-list'),
    progressBar: document.getElementById('progress-bar'),
    guessInput: document.getElementById('guess-input'),
    guessBtn: document.getElementById('guess-btn'),
    resultOverlay: document.getElementById('result-overlay'),
    revealedName: document.getElementById('revealed-name'),
    resetBtn: document.getElementById('reset-game-btn'),
    subTitle: document.getElementById('sub-title')
};

/**
 * Switch between application views
 */
function switchView(phase) {
    state.currentPhase = phase;
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[phase].classList.add('active');

    if (phase === 'trait-entry') {
        renderPlayerChips();
        updateTraitEntryUI();
    } else if (phase === 'guessing') {
        elements.subTitle.textContent = '설명을 입력하면 AI가 누구인지 맞춥니다.';
    }
}

/**
 * Render player chips to show progress
 */
function renderPlayerChips() {
    elements.playerStatusList.innerHTML = '';
    state.players.forEach((player, index) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        if (index === state.currentPlayerIndex) chip.classList.add('active');
        if (index < state.currentPlayerIndex) chip.classList.add('completed');
        chip.textContent = player.name;
        elements.playerStatusList.appendChild(chip);
    });
}

/**
 * Update UI for the current player in trait entry phase
 */
function updateTraitEntryUI() {
    const playerName = state.players[state.currentPlayerIndex].name;
    elements.currentPlayerTitle.textContent = `${playerName}님의 정보 입력 (${state.currentPlayerIndex + 1}/${state.maxPlayers})`;
    elements.traitTextarea.value = state.players[state.currentPlayerIndex].traits || '';
    elements.traitTextarea.focus();
    
    // Toggle Prev Button
    if (state.currentPlayerIndex > 0) {
        elements.prevTraitBtn.classList.remove('hidden');
    } else {
        elements.prevTraitBtn.classList.add('hidden');
    }

    const progress = ((state.currentPlayerIndex) / state.maxPlayers) * 100;
    elements.progressBar.style.width = `${progress}%`;
    renderPlayerChips();
}

/**
 * Advanced Matching Algorithm (Legacy Fallback)
 */
function findBestMatch(input) {
    const normalize = (text) => text.replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ').toLowerCase().trim();
    const cleanInput = normalize(input);
    const inputWords = cleanInput.split(/\s+/).filter(w => w.length >= 1);
    
    if (inputWords.length === 0) return state.players.length > 0 ? state.players[0].name : "???";

    let bestMatch = state.players.length > 0 ? state.players[0].name : "???";
    let highestScore = -1;

    state.players.forEach(player => {
        const playerTraits = normalize(player.traits);
        const traitWords = playerTraits.split(/\s+/).filter(w => w.length >= 1);
        let score = 0;

        inputWords.forEach(iWord => {
            if (playerTraits.includes(iWord)) {
                score += 1.0;
                if (new RegExp(`(^|\\s)${iWord}($|\\s)`).test(playerTraits)) {
                    score += 0.5;
                }
            }
            if (iWord.length > 2) {
                traitWords.forEach(tWord => {
                    if (tWord.includes(iWord) || iWord.includes(tWord)) {
                        score += 0.3;
                    }
                });
            }
        });

        const matchedUniqueWords = inputWords.filter(w => playerTraits.includes(w));
        const uniqueMatchRatio = matchedUniqueWords.length / inputWords.length;
        score += uniqueMatchRatio * 2.0;

        const lengthDifference = Math.abs(inputWords.length - traitWords.length);
        const penalty = lengthDifference * 0.01;
        const finalScore = score - penalty;

        if (finalScore > highestScore) {
            highestScore = finalScore;
            bestMatch = player.name;
        }
    });

    return bestMatch;
}

/**
 * AI Matching via Gemini API (Direct)
 */
async function findBestMatchAI(input) {
    // API 키가 설정되지 않은 경우 로컬 알고리즘 사용
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_FREE_GEMINI_API_KEY_HERE") {
        console.warn("Gemini API Key가 설정되지 않았습니다. 기본 알고리즘을 사용합니다.");
        return findBestMatch(input);
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const playerInfo = state.players.map(p => `- ${p.name}: ${p.traits}`).join('\n');
        
        const prompt = `
            당신은 사람들의 특징을 분석하여 누구인지 맞추는 추측 전문가입니다.
            다음은 7명의 정보입니다:
            ${playerInfo}

            사용자가 입력한 설명: "${input}"

            위 설명을 바탕으로 가장 일치하는 사람의 이름만 정확히 출력하세요. 
            다른 설명이나 문장은 필요 없습니다. 오직 이름만 출력하세요.
            만약 아무도 일치하지 않는다면 가장 가능성이 높은 사람의 이름을 선택하세요.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        const matchedPlayer = state.players.find(p => text.includes(p.name));
        return matchedPlayer ? matchedPlayer.name : findBestMatch(input);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return findBestMatch(input);
    }
}

// Event Listeners

// Phase 1: Registration
elements.startGameBtn.addEventListener('click', () => {
    const names = Array.from(elements.nameInputs).map(input => input.value.trim());
    if (names.some(name => name === '')) {
        alert('모든 플레이어의 이름을 입력해 주세요.');
        return;
    }
    state.players = names.map(name => ({ name, traits: '' }));
    switchView('trait-entry');
});

// Phase 2: Trait Entry
elements.nextTraitBtn.addEventListener('click', () => {
    const traits = elements.traitTextarea.value.trim();
    if (traits.length < 5) {
        alert('조금 더 자세한 정보를 입력해 주세요.');
        return;
    }
    state.players[state.currentPlayerIndex].traits = traits;
    state.currentPlayerIndex++;

    if (state.currentPlayerIndex < state.maxPlayers) {
        updateTraitEntryUI();
    } else {
        elements.progressBar.style.width = '100%';
        setTimeout(() => switchView('guessing'), 500);
    }
});

elements.prevTraitBtn.addEventListener('click', () => {
    if (state.currentPlayerIndex > 0) {
        state.currentPlayerIndex--;
        updateTraitEntryUI();
    }
});

// Phase 3: Guessing
elements.guessBtn.addEventListener('click', async () => {
    const input = elements.guessInput.value.trim();
    if (input === '') {
        alert('설명을 입력해 주세요.');
        return;
    }

    elements.guessBtn.disabled = true;
    elements.guessBtn.textContent = 'AI가 분석 중...';
    
    const startTime = Date.now();
    const match = await findBestMatchAI(input);
    
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 1500) {
        await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime));
    }

    elements.revealedName.textContent = match;
    elements.resultOverlay.classList.remove('hidden');
    elements.guessBtn.disabled = false;
    elements.guessBtn.textContent = '누구일까요?';
});

// Reset
elements.resetBtn.addEventListener('click', () => {
    state.currentPlayerIndex = 0;
    state.players = [];
    elements.resultOverlay.classList.add('hidden');
    elements.guessInput.value = '';
    elements.nameInputs.forEach(input => input.value = '');
    elements.subTitle.textContent = '7명의 친구를 등록하고 특징을 입력하세요.';
    switchView('registration');
});

/**
 * Voice Input Manager using Web Speech API
 */
class VoiceInputManager {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.activeBtn = null;
        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("이 브라우저는 음성 인식을 지원하지 않습니다.");
            document.querySelectorAll('.voice-btn').forEach(btn => btn.style.display = 'none');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ko-KR';
        this.recognition.interimResults = true;
        this.recognition.continuous = false;

        this.recognition.onstart = () => {
            this.isRecording = true;
            if (this.activeBtn) this.activeBtn.classList.add('recording');
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            if (this.activeBtn) this.activeBtn.classList.remove('recording');
            this.activeBtn = null;
        };

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            if (this.activeBtn) {
                const targetId = this.activeBtn.dataset.target;
                const textarea = document.getElementById(targetId);
                if (textarea && event.results[0].isFinal) {
                    textarea.value = (textarea.value + ' ' + transcript).trim();
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            this.stop();
        };

        document.querySelectorAll('.voice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle(btn);
            });
        });
    }

    toggle(btn) {
        if (this.isRecording) {
            this.stop();
            if (this.activeBtn !== btn) {
                this.start(btn);
            }
        } else {
            this.start(btn);
        }
    }

    start(btn) {
        if (!this.recognition) return;
        this.activeBtn = btn;
        try {
            this.recognition.start();
        } catch (e) {
            console.error("Recognition start failed:", e);
        }
    }

    stop() {
        if (!this.recognition) return;
        this.recognition.stop();
    }
}

// Initialize Voice Input
const voiceManager = new VoiceInputManager();

// Initial Focus
window.addEventListener('DOMContentLoaded', () => {
    elements.nameInputs[0].focus();
});
