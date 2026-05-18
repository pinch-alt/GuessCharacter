/**
 * AI Guessing Game: Who is it?
 * Main Application Logic
 */

// Application State
const state = {
    players: [], // Array of { name: string, traits: string[] }
    currentPhase: 'registration', // registration, trait-entry, guessing
    currentPlayerIndex: 0,
    maxPlayers: 7
};

// DOM Elements
const views = {
    registration: document.getElementById('registration-view'),
    traitEntry: document.getElementById('trait-entry-view'),
    guessing: document.getElementById('guessing-view')
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
 * Keyword similarity algorithm
 */
function findBestMatch(input) {
    const inputWords = input.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    
    let bestMatch = null;
    let highestScore = -1;

    state.players.forEach(player => {
        let score = 0;
        const playerTraits = player.traits.toLowerCase();
        
        inputWords.forEach(word => {
            if (playerTraits.includes(word)) {
                score++;
            }
        });

        if (score > highestScore) {
            highestScore = score;
            bestMatch = player.name;
        }
    });

    return bestMatch;
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

    // AI Processing Effect
    elements.guessBtn.disabled = true;
    elements.guessBtn.textContent = 'AI가 분석 중...';
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const match = findBestMatch(input);
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
