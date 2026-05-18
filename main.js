/**
 * AI Guessing Game: Who is it?
 * Main Application Logic
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

// Application State
const state = {
    players: [], // Array of { name: string, traits: string[] }
    currentPhase: 'registration', // registration, trait-entry, guessing
    currentPlayerIndex: 0,
    maxPlayers: 7,
    isApiConnected: false,
    apiKey: ''
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
    subTitle: document.getElementById('sub-title'),
    apiKeyInput: document.getElementById('gemini-api-key'),
    checkApiBtn: document.getElementById('check-api-btn'),
    apiStatusDot: document.getElementById('api-status')
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
    // 1. Text Normalization
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

        // A. Word Overlap (Intersection)
        inputWords.forEach(iWord => {
            // Direct word match
            if (playerTraits.includes(iWord)) {
                score += 1.0;
                // Exact word match bonus (handling spaces)
                if (new RegExp(`(^|\\s)${iWord}($|\\s)`).test(playerTraits)) {
                    score += 0.5;
                }
            }
            
            // Partial match for longer words
            if (iWord.length > 2) {
                traitWords.forEach(tWord => {
                    if (tWord.includes(iWord) || iWord.includes(tWord)) {
                        score += 0.3;
                    }
                });
            }
        });

        // B. Bonus for matching multiple unique concepts
        const matchedUniqueWords = inputWords.filter(w => playerTraits.includes(w));
        const uniqueMatchRatio = matchedUniqueWords.length / inputWords.length;
        score += uniqueMatchRatio * 2.0;

        // C. Length Normalization (avoid bias towards very long descriptions)
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
 * AI Matching via Gemini API
 */
async function findBestMatchAI(input) {
    if (!state.apiKey || !state.isApiConnected) {
        console.warn("API Key missing or not verified, falling back to legacy algorithm.");
        return findBestMatch(input);
    }

    try {
        const genAI = new GoogleGenerativeAI(state.apiKey);
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
        
        // Ensure the returned text is one of our player names
        const matchedPlayer = state.players.find(p => text.includes(p.name));
        return matchedPlayer ? matchedPlayer.name : findBestMatch(input);
    } catch (error) {
        console.error("Gemini API Error:", error);
        // On recurring errors, reset connection state
        state.isApiConnected = false;
        updateApiStatus('error');
        return findBestMatch(input);
    }
}

/**
 * Validate Gemini API Key
 */
async function validateApiKey() {
    const inputKey = elements.apiKeyInput.value.trim();
    if (!inputKey) {
        alert("API Key를 입력해 주세요.");
        return;
    }

    updateApiStatus('validating');
    elements.checkApiBtn.disabled = true;

    try {
        // Create instance with the provided key
        const genAI = new GoogleGenerativeAI(inputKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // More robust test request
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Respond with only the word 'OK'" }] }]
        });
        const response = await result.response;
        const text = response.text();
        
        if (text) {
            state.apiKey = inputKey;
            state.isApiConnected = true;
            updateApiStatus('connected');
            alert("Gemini API가 성공적으로 연동되었습니다! 이제 AI 추측 모드를 사용할 수 있습니다.");
        } else {
            throw new Error("Empty response");
        }
    } catch (error) {
        console.error("Validation Error Details:", error);
        
        let errorMessage = "API Key 연동에 실패했습니다.";
        
        if (error.message.includes("API_KEY_INVALID")) {
            errorMessage = "유효하지 않은 API Key입니다. 키를 다시 확인해 주세요.";
        } else if (error.message.includes("blocked") || error.message.includes("CORS")) {
            errorMessage = "브라우저 보안 설정이나 확장 프로그램에 의해 요청이 차단되었습니다.";
        } else if (error.message.includes("fetch")) {
            errorMessage = "네트워크 연결이 불안정하거나 API 서버에 접속할 수 없습니다.";
        }
        
        updateApiStatus('error');
        state.isApiConnected = false;
        alert(errorMessage);
    } finally {
        elements.checkApiBtn.disabled = false;
    }
}

/**
 * Update API Status UI
 */
function updateApiStatus(status) {
    elements.apiStatusDot.className = 'status-dot';
    if (status !== 'disconnected') {
        elements.apiStatusDot.classList.add(status);
    }
    
    const titles = {
        'connected': '연동됨 (정상)',
        'validating': '연동 확인 중...',
        'error': '오류 발생 (키 확인 필요)',
        'disconnected': '연동되지 않음'
    };
    elements.apiStatusDot.title = titles[status] || titles.disconnected;
}

// Event Listeners

// API Key Validation
elements.checkApiBtn.addEventListener('click', validateApiKey);

// Key input enter key support
elements.apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateApiKey();
});

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

    // AI Processing Effect
    elements.guessBtn.disabled = true;
    elements.guessBtn.textContent = 'AI가 분석 중...';
    
    const startTime = Date.now();
    
    // Attempt AI matching if connected, else fallback
    let match;
    if (state.isApiConnected && state.apiKey) {
        match = await findBestMatchAI(input);
    } else {
        match = findBestMatch(input);
    }
    
    // Ensure the animation lasts at least 1.5 seconds for visual effect
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

// Initial Focus
window.addEventListener('DOMContentLoaded', () => {
    elements.nameInputs[0].focus();
});
