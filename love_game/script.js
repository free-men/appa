// --- GAME STATE ---
const state = {
    trust: 0,
    currentStep: 'intro',
    audioEnabled: false,
    audioInitialized: false,
    soundVolume: 0.3,
    typewriterActive: false
};

// --- AUDIO SYNTHESIZER ENGINE (Web Audio API) ---
let audioCtx = null;
let ambientOsc1 = null;
let ambientOsc2 = null;
let ambientGain = null;
let ambientFilter = null;
let pianoDelayNode = null;

function initAudio() {
    if (state.audioInitialized) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        // Setup Ambient Synthesizer (Drones & Pads)
        ambientGain = audioCtx.createGain();
        ambientGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        
        ambientFilter = audioCtx.createBiquadFilter();
        ambientFilter.type = 'lowpass';
        ambientFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
        
        // Deep low oscillator (A1 = 55Hz)
        ambientOsc1 = audioCtx.createOscillator();
        ambientOsc1.type = 'sine';
        ambientOsc1.frequency.setValueAtTime(55, audioCtx.currentTime);
        
        // Fifth harmony (E2 = 82.4Hz)
        ambientOsc2 = audioCtx.createOscillator();
        ambientOsc2.type = 'triangle';
        ambientOsc2.frequency.setValueAtTime(82.4, audioCtx.currentTime);
        
        // Connect ambient
        ambientOsc1.connect(ambientFilter);
        ambientOsc2.connect(ambientFilter);
        ambientFilter.connect(ambientGain);
        ambientGain.connect(audioCtx.destination);
        
        // Start oscillators
        ambientOsc1.start();
        ambientOsc2.start();
        
        // Setup Delay effect for the generative piano
        pianoDelayNode = audioCtx.createDelay(1.0);
        pianoDelayNode.delayTime.setValueAtTime(0.4, audioCtx.currentTime);
        
        const delayFeedback = audioCtx.createGain();
        delayFeedback.gain.setValueAtTime(0.4, audioCtx.currentTime);
        
        const pianoDelayVolume = audioCtx.createGain();
        pianoDelayVolume.gain.setValueAtTime(0.08, audioCtx.currentTime);
        
        pianoDelayNode.connect(delayFeedback);
        delayFeedback.connect(pianoDelayNode);
        pianoDelayNode.connect(pianoDelayVolume);
        pianoDelayVolume.connect(audioCtx.destination);
        
        // Start atmospheric modulation
        modulateAmbient();
        
        // Start procedural piano melody generator
        startGenerativePiano();
        
        state.audioInitialized = true;
        console.log("Audio Engine successfully initialized.");
    } catch (e) {
        console.error("Web Audio API is not supported in this browser", e);
    }
}

// Low frequency modulation of filter to make drone feel alive
function modulateAmbient() {
    if (!audioCtx || !ambientFilter) return;
    
    const now = audioCtx.currentTime;
    // Sweep filter frequency between 200Hz and 450Hz over 8 seconds
    const targetFreq = 200 + Math.random() * 250;
    ambientFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 8);
    
    setTimeout(modulateAmbient, 8000);
}

// Procedural Gothic/Romantic melody generator (plays notes from A minor / C major / D dorian mood)
const pianoNotes = [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
function startGenerativePiano() {
    if (!state.audioEnabled || !audioCtx) {
        setTimeout(startGenerativePiano, 2000);
        return;
    }
    
    // Random interval between notes
    const delay = 1500 + Math.random() * 3000;
    
    // Chance to play note
    if (Math.random() > 0.3) {
        const noteFreq = pianoNotes[Math.floor(Math.random() * pianoNotes.length)];
        playPianoNote(noteFreq);
    }
    
    setTimeout(startGenerativePiano, delay);
}

function playPianoNote(frequency) {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    
    // Synthesize piano sound: fundamental + soft harmonics
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Triangle wave gives a soft flute/bell-like quality suitable for romantic gothic feel
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    
    // Very quick attack, long decay and release
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Decay
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Also send to delay node for rich spaciousness
    if (pianoDelayNode) {
        gainNode.connect(pianoDelayNode);
    }
    
    osc.start(now);
    osc.stop(now + 3.0);
}

// Sound effect: Paper writing (scritch-scratch noise bursts)
function playWritingSound() {
    if (!state.audioEnabled || !audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.08; // Very short burst
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Bandpass filter to make it sound like paper scratching
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 600, now);
    filter.Q.setValueAtTime(4.0, now);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.025 + Math.random() * 0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noiseSource.start(now);
}

// Sound effect: Pluck for click/hover
function playPluckSound(pitch = 440) {
    if (!state.audioEnabled || !audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
}

// Sound effect: Successful puzzle solution
function playSuccessChime() {
    if (!state.audioEnabled || !audioCtx || audioCtx.state === 'suspended') return;
    
    const notes = [261.63, 329.63, 392.0, 523.25]; // C major chord
    notes.forEach((freq, index) => {
        setTimeout(() => {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(now);
            osc.stop(now + 0.8);
        }, index * 120);
    });
}

// Sound effect: Fail tone
function playErrorTone() {
    if (!state.audioEnabled || !audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    // Low pass filter to dampen the sawtooth
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.45);
}

// Toggle Sound State
function toggleSound() {
    if (!state.audioInitialized) {
        initAudio();
    }
    
    state.audioEnabled = !state.audioEnabled;
    const soundBtn = document.getElementById('sound-btn');
    const soundIcon = soundBtn.querySelector('.sound-icon');
    const soundText = soundBtn.querySelector('.sound-text');
    
    if (state.audioEnabled) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        soundIcon.textContent = '🔊';
        soundText.textContent = 'Звук: Увімкнено';
        soundBtn.classList.add('sound-on');
        
        // Play simple sign-on chime
        playPluckSound(523.25); // C5
        setTimeout(() => playPluckSound(659.25), 150); // E5
        
        if (ambientGain) {
            ambientGain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1);
        }
    } else {
        soundIcon.textContent = '🔈';
        soundText.textContent = 'Звук: Вимкнено';
        soundBtn.classList.remove('sound-on');
        
        if (ambientGain) {
            ambientGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.5);
        }
    }
}

// --- TYPEWRITER / INK WRITING SYSTEM ---
function typeWriteToLog(logId, character, text, isHandwritten = false, speed = 30, callback = null) {
    state.typewriterActive = true;
    const logEl = document.getElementById(logId);
    
    // Create the new entry container
    const entry = document.createElement('div');
    entry.className = `log-entry ${isHandwritten ? 'max-said' : 'anna-said'} dialogue-bubble`;
    entry.innerHTML = `<strong>${character}:</strong> `;
    logEl.appendChild(entry);
    
    // Create the typing span inside the entry
    const span = document.createElement('span');
    span.className = 'writing-effect';
    entry.appendChild(span);
    
    let index = 0;
    function writeChar() {
        if (index < text.length) {
            span.textContent += text.charAt(index);
            index++;
            
            // Play writing sound on letter creation
            if (index % 2 === 0 && text.charAt(index) !== ' ') {
                playWritingSound();
            }
            
            // Smoothly scroll the page-body container as we write
            logEl.scrollTop = logEl.scrollHeight;
            
            setTimeout(writeChar, speed);
        } else {
            // Remove typewriter cursor
            span.className = '';
            state.typewriterActive = false;
            logEl.scrollTop = logEl.scrollHeight;
            if (callback) callback();
        }
    }
    
    writeChar();
}


// Update Trust Meter
function updateTrust(amount) {
    state.trust = Math.min(100, Math.max(0, state.trust + amount));
    const trustBar = document.getElementById('trust-bar-fill');
    const trustVal = document.getElementById('trust-value');
    
    trustBar.style.width = state.trust + '%';
    trustVal.textContent = state.trust + '%';
    
    // Subtle flash animation on trust indicator
    const trustContainer = document.querySelector('.trust-container');
    trustContainer.style.transform = 'scale(1.1)';
    setTimeout(() => {
        trustContainer.style.transform = 'scale(1)';
    }, 200);
}

// Append entries to logs
function appendToLog(logId, character, text, isHandwritten = false) {
    const logEl = document.getElementById(logId);
    const entry = document.createElement('div');
    entry.className = `log-entry ${isHandwritten ? 'max-said' : 'anna-said'} dialogue-bubble`;
    entry.innerHTML = `<strong>${character}:</strong> ${text}`;
    logEl.appendChild(entry);
    
    // Scroll to bottom
    logEl.scrollTop = logEl.scrollHeight;
}

function appendSystemDesc(logId, text) {
    const logEl = document.getElementById(logId);
    const entry = document.createElement('div');
    entry.className = 'log-entry system-desc';
    entry.textContent = text;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
}

// --- STORYLINE DATA ---
const story = {
    intro: {
        narrative: "Свічка Анни ледь розсіювала темряву старої вежі. Пальці торкнулися прохолодної шкіряної палітурки. Книга наче чекала на неї. Вона відкрила першу сторінку. Вона була абсолютно чистою.",
        actions: () => {
            appendToLog('anna-log', 'Анна', 'Дивно... Навіщо зберігати порожню книгу в оксамитовому футлярі?');
        },
        choices: [
            {
                text: "Гортати далі",
                next: 'book_writes'
            }
        ]
    },
    book_writes: {
        narrative: "На чистій сторінці книги починають вимальовуватися чорнильні літери, наче хтось пише їх невидимою рукою...",
        actions: () => {
            appendSystemDesc('max-log', '[Текст з\'являється в реальному часі]');
        },
        maxWrite: "15 травня 1888 року. Мене звинувачують у чаклунстві, якого я не вчиняв. Якщо хтось із майбутнього читає це... допоможіть мені знайти ключ від підвалу, поки варта не вибила двері.",
        choices: [
            {
                text: "Відповісти емпатично",
                trustChange: 25,
                logResponse: "Хто ви? Як ви пишете це? Мені страшно, але я вас чую.",
                next: 'dialogue_empathic'
            },
            {
                text: "Відповісти раціонально",
                trustChange: 0,
                logResponse: "Це чийсь жарт? Тут встановлені приховані екрани?",
                next: 'dialogue_rational'
            },
            {
                text: "Відповісти рішуче",
                trustChange: 15,
                logResponse: "Я не вірю в містику, але де ви перебуваєте? Я огляну кімнату.",
                next: 'dialogue_resolute'
            }
        ]
    },
    dialogue_empathic: {
        narrative: "Здається, книга реагує на ваші емоції. Рівень довіри зріс.",
        actions: () => {},
        maxWrite: "О боги, вона відповіла! Твої літери світяться синім вогнем на моєму пергаменті. Мене звати Макс. Я замкнений у кабінеті на вежі. Тут є таємна ніша за портретом засновника, але я забув шифр. Напиши, що сталося з цим місцем?",
        choices: [
            {
                text: "Розповісти правду про вежу",
                next: 'dialogue_manor_state'
            }
        ]
    },
    dialogue_rational: {
        narrative: "Чорнила на сторінці з'являються з певною затримкою, наче письменник розгубився.",
        actions: () => {},
        maxWrite: "Які ще екрани? Я пишу це гусячим пером при світлі однієї свічки... Мене звати Макс. Я не знаю, що це за магія, але моє життя висить на волосині. У цьому кабінеті на вежі є сховок за портретом батька, але я не можу згадати комбінацію замка. Будь ласка, допоможи.",
        choices: [
            {
                text: "Описати сучасний стан вежі",
                next: 'dialogue_manor_state'
            }
        ]
    },
    dialogue_resolute: {
        narrative: "Макс відповідає швидко, його почерк стає розмашистим.",
        actions: () => {},
        maxWrite: "Смілива леді... Моє ім'я Макс, і я пишу це з 1888 року. За моїми дверима варта, і єдиний порятунок — ніша за портретом засновника. Вона замкнена на кодовий замок. Допоможи мені відкрити її. Розкажи, що з кабінетом у твоєму часі?",
        choices: [
            {
                text: "Описати вежу в 2026 році",
                next: 'dialogue_manor_state'
            }
        ]
    },
    dialogue_manor_state: {
        narrative: "Ви оглядаєте руїни навколо себе і записуєте відповідь.",
        actions: () => {
            appendToLog('anna-log', 'Анна', 'Максе... Зараз 2026 рік. Цей маєток — напівзруйнований музей. Портрет засновника все ще тут, але він покритий тріщинами.');
        },
        choices: [
            {
                text: "Підійти до портрета",
                next: 'trigger_puzzle'
            }
        ]
    },
    trigger_puzzle: {
        narrative: "Ви підходите до старого, потемнілого від часу портрета чоловіка в суворому вбранні. На рамі видно чотири дивні символи: Сонце, Місяць, Зірка, Комета.",
        actions: () => {
            appendToLog('anna-log', 'Анна', 'Максе, я стою перед портретом. Тут є кодовий замок із символами світил. У моєму часі механізм заіржавів і заклинив на символі Зірки.');
            setTimeout(() => {
                // Max replies frantically
                typeWriteToLog('max-log', 'Макс', 
                    "Зірка! Звісно! Мій батько казав: \"Шлях починається там, де падає світло ночі, і закінчується світанком\". Анна, підкажи, в якому порядку рухаються світила від ночі до ранку?",
                    true,
                    30, 
                    () => {
                        showPuzzleModal();
                    }
                );
            }, 1000);
        },
        choices: [] // Locked until puzzle solved
    },
    after_puzzle: {
        narrative: "Чорнила шалено розтікаються по сторінці.",
        actions: () => {
            // Background interactive updates
            document.getElementById('era-max').style.flexGrow = '1.3';
            document.getElementById('era-anna').style.flexGrow = '0.7';
        },
        maxWrite: "Спрацювало! Стіна відчинилася! Анна, ти неймовірна. Твій розум врятував мене від плахи. Я знайшов тут золотий кулон із твоїм ім'ям... Зачекай, але я знайшов його в минулому. Як це можливо?",
        choices: [
            {
                text: "Здивуватися",
                trustChange: 10,
                logResponse: "Моє ім'я? Але я ніколи не була в минулому... Як таке може бути?",
                next: 'butterfly_effect'
            },
            {
                text: "Виявити романтичність",
                trustChange: 25,
                logResponse: "Це схоже на чудо. Можливо, наші долі були переплетені ще тоді?",
                next: 'butterfly_effect'
            },
            {
                text: "Спробувати пояснити логічно",
                trustChange: 5,
                logResponse: "Мабуть, це збіг. Або хтось спеціально поклав його туди для тебе.",
                next: 'butterfly_effect'
            }
        ]
    },
    butterfly_effect: {
        narrative: "Несподівано ви чуєте дивний тріск у сучасній кімнаті бібліотеки. Стара шухляда комода, яка була заклинена намертво, з тихим клацанням прочиняється.",
        actions: () => {
            appendSystemDesc('anna-log', '[Ефект метелика: кімната навколо змінилася]');
            appendToLog('anna-log', 'Анна', 'Максе! У мене щойно сама собою відчинилася шухляда столу, яка була забита цвяхами! Там лежить лист, написаний твоїм почерком!');
        },
        maxWrite: "Я заховав його туди щойно, за портретом! Отже, кожен мій крок змінює твоє теперішнє... Анна, мій кузен Антоній веде сюди варту. Він хоче звинуватити мене у єресі та забрати сімейний спадок. У твоєму часі маєток теж належить його роду?",
        choices: [
            {
                text: "Попередити Макса про нащадка Антонія",
                next: 'antagonist_reveal'
            }
        ]
    },
    antagonist_reveal: {
        narrative: "Ви розумієте, що небезпека загрожує вам обом.",
        actions: () => {
            appendToLog('anna-log', 'Анна', 'Так! Його нащадок, Річард, зараз намагається вигнати мене з маєтку. Він шукає тут алхімічний підвал із родинними скарбами. Максе, ти маєш втекти!');
        },
        maxWrite: "Втекти... Але куди? Єдине безпечне місце — це стародавній підвал. Батько казав, що там є дзеркало часу, яке працює від алхімічної солі. Якщо я піду туди, я зможу потрапити у твій час? Чи це загибель?",
        choices: [
            {
                text: "Відправитися до підвалу разом (кожен у своєму часі)",
                next: 'cellar_transition'
            }
        ]
    },
    cellar_transition: {
        narrative: "Ви спускаєтеся гвинтовими сходами у глибокий холодний підвал. У темряві сучасності та у свічковому полум'ї минулого перед вами постає величезне срібне дзеркало з рунами на рамі.",
        actions: () => {
            appendToLog('anna-log', 'Анна', 'Я стою біля дзеркала, Максе. Воно тепле... і вібрує. Здається, твої чорнила на сторінці починають світитися золотом.');
        },
        maxWrite: "Я бачу твоє силует у склі, Анна! Наче крізь туман. Портал нестабільний, дзеркало тріскається від напруги. Нам треба вирішувати зараз... Варта вже вибиває двері підвалу в 1888-му! Що мені робити?",
        afterMaxWrite: () => {
            // Show portal after typewriter finishes, with a brief dramatic pause
            setTimeout(() => showPortalChoices(), 1500);
        },
        choices: [] // Locked, handled by portal screen
    }
};

// --- GAME CONTROLLER FUNCTIONS ---
function startGame() {
    // Start Audio Context if user interacted
    initAudio();
    if (state.audioEnabled && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Play transition sound
    playPluckSound(440);
    
    document.getElementById('sound-control').classList.remove('hidden');
    document.getElementById('title-screen').style.opacity = 0;
    setTimeout(() => {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-screen').style.opacity = 1;
        
        // Load first scene
        loadScene('intro');
    }, 1000);
}

function loadScene(sceneKey) {
    state.currentStep = sceneKey;
    const currentScene = story[sceneKey];
    
    // Set narrative ambient instruction text
    document.getElementById('narrative-text').textContent = currentScene.narrative;
    
    // Run actions
    currentScene.actions();
    
    // Handle Max writing on right page
    if (currentScene.maxWrite) {
        typeWriteToLog('max-log', 'Макс', currentScene.maxWrite, true, 30, () => {
            renderChoices(currentScene.choices);
            // Run optional post-typewriter callback (e.g. cellar_transition portal)
            if (currentScene.afterMaxWrite) {
                currentScene.afterMaxWrite();
            }
        });
    } else {
        renderChoices(currentScene.choices);
    }
}

function renderChoices(choices) {
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    if (!choices || choices.length === 0) return;
    
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice';
        btn.textContent = choice.text;
        
        btn.addEventListener('click', () => {
            if (state.typewriterActive) return; // Prevent clicking during writing
            
            playPluckSound(587.33); // D5 chime
            
            // Apply trust updates
            if (choice.trustChange !== undefined) {
                updateTrust(choice.trustChange);
            }
            
            // Log response if Anna spoke
            if (choice.logResponse) {
                appendToLog('anna-log', 'Анна', choice.logResponse);
            }
            
            // Load next scene
            loadScene(choice.next);
        });
        
        container.appendChild(btn);
    });
}

// --- PORTRAIT PUZZLE SYSTEM ---
let puzzleSequence = ['star', 'moon', 'sun', 'comet']; // Current layout on screen
const correctSequence = ['moon', 'comet', 'star', 'sun']; // Correct chronological layout

function showPuzzleModal() {
    document.getElementById('puzzle-modal').classList.remove('hidden');
    document.getElementById('puzzle-modal').style.opacity = 1;
    initDragAndDrop();
}

function initDragAndDrop() {
    const container = document.getElementById('symbols-container');
    
    // Clone all nodes to strip previous event listeners (prevents stacking on replay)
    const nodes = container.querySelectorAll('.symbol-node');
    nodes.forEach(node => {
        const fresh = node.cloneNode(true);
        node.parentNode.replaceChild(fresh, node);
    });
    
    const freshNodes = container.querySelectorAll('.symbol-node');
    freshNodes.forEach(node => {
        // Drag events
        node.addEventListener('dragstart', (e) => {
            node.classList.add('dragging');
            e.dataTransfer.setData('text/plain', node.dataset.id);
            playPluckSound(330);
        });
        
        node.addEventListener('dragend', () => {
            node.classList.remove('dragging');
        });
        
        node.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingNode = container.querySelector('.dragging');
            if (!draggingNode) return;
            const siblings = [...container.querySelectorAll('.symbol-node:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                const rect = sibling.getBoundingClientRect();
                return e.clientX <= rect.left + rect.width / 2;
            });
            
            container.insertBefore(draggingNode, nextSibling);
        });
        
        // Touch/Click to swap support for mobile and easy play
        node.addEventListener('click', () => {
            const active = container.querySelector('.active-symbol');
            if (active && active !== node) {
                // Swap nodes
                const parent = container;
                const activeNext = active.nextSibling;
                const nodeNext = node.nextSibling;
                
                if (activeNext === node) {
                    parent.insertBefore(node, active);
                } else if (nodeNext === active) {
                    parent.insertBefore(active, node);
                } else {
                    parent.insertBefore(node, activeNext);
                    parent.insertBefore(active, nodeNext);
                }
                active.classList.remove('active-symbol');
                playPluckSound(349.23);
                checkCurrentSequence();
            } else {
                if (active) active.classList.remove('active-symbol');
                node.classList.add('active-symbol');
                playPluckSound(392.0);
            }
        });
    });
}

function checkCurrentSequence() {
    const container = document.getElementById('symbols-container');
    const nodes = [...container.querySelectorAll('.symbol-node')];
    puzzleSequence = nodes.map(n => n.dataset.id);
}

document.getElementById('submit-puzzle').addEventListener('click', () => {
    checkCurrentSequence();
    const feedback = document.getElementById('puzzle-feedback');
    
    const isCorrect = puzzleSequence.every((val, index) => val === correctSequence[index]);
    
    if (isCorrect) {
        playSuccessChime();
        feedback.textContent = "Чудово! Механізм заклацав. Стародавні шестерні повертаються у минулому!";
        feedback.className = "puzzle-feedback feedback-success";
        
        // Append system log
        appendSystemDesc('anna-log', '[Загадку розв\'язано: Місяць -> Комета -> Зірка -> Сонце]');
        appendToLog('anna-log', 'Анна', 'Максе! Я виставила правильний порядок світил на рамі портрета! Рух почався!');
        
        setTimeout(() => {
            document.getElementById('puzzle-modal').classList.add('hidden');
            loadScene('after_puzzle');
        }, 2000);
    } else {
        playErrorTone();
        feedback.textContent = "Нічого не відбувається. Символи не викликають резонансу. Спробуйте інший порядок.";
        feedback.className = "puzzle-feedback feedback-error";
    }
});

// --- TIME PORTAL ENDINGS ---
let portalAnimationId = null;

function showPortalChoices() {
    document.getElementById('portal-screen').classList.remove('hidden');
    document.getElementById('portal-screen').style.opacity = 1;
    startPortalAnimation();
}

function startPortalAnimation() {
    const canvas = document.getElementById('portal-canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = [
        'rgba(99, 179, 237, 0.08)',  // Cold blue (Anna)
        'rgba(246, 173, 85, 0.08)',  // Warm amber (Max)
        'rgba(147, 51, 234, 0.05)'   // Time purple
    ];
    
    let angle = 0;
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.max(canvas.width, canvas.height) * 0.6;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        // Draw spiral arms
        for (let i = 0; i < 180; i++) {
            const rad = (i / 180) * maxRadius;
            const theta = i * 0.15;
            const x = rad * Math.cos(theta);
            const y = rad * Math.sin(theta);
            
            ctx.beginPath();
            ctx.arc(x, y, 2 + (rad * 0.015), 0, Math.PI * 2);
            ctx.fillStyle = colors[i % colors.length];
            ctx.shadowBlur = 10;
            ctx.shadowColor = i % 2 === 0 ? '#63b3ed' : '#f6ad55';
            ctx.fill();
        }
        
        ctx.restore();
        
        angle += 0.005;
        portalAnimationId = requestAnimationFrame(draw);
    }
    
    draw();
}

// Ending choices click handlers
document.getElementById('choice-stay').addEventListener('click', () => {
    cancelAnimationFrame(portalAnimationId);
    showFinalEnding('stay');
});

document.getElementById('choice-go').addEventListener('click', () => {
    cancelAnimationFrame(portalAnimationId);
    showFinalEnding('go');
});

function showFinalEnding(choice) {
    document.getElementById('portal-screen').classList.add('hidden');
    document.getElementById('ending-screen').classList.remove('hidden');
    document.getElementById('ending-screen').style.opacity = 1;
    
    const titleEl = document.getElementById('ending-title');
    const descEl = document.getElementById('ending-desc');
    const coverEl = document.querySelector('.ending-overlay');
    
    if (choice === 'stay') {
        titleEl.textContent = "Гірка розлука";
        descEl.innerHTML = `Ви вирішили залишитися в 2026 році. Ви швидко записали в щоденник план порятунку для Макса, описавши засідку Антонія.<br><br>
        Завдяки вашим підказкам, Макс зміг обійти варту, викрити змови кузена перед королівським судом та зберегти маєток. 
        Однак дзеркало часу розбилося. Золотий кулон залишився у вас як єдиний доказ того, що це не було сном. 
        У сучасності маєток визнали історичною пам'яткою архітектури, а Річарда відсторонили від спадщини. 
        Анна продовжила свою роботу реставратора, але щоразу, відкриваючи стару книгу, вона сподівається побачити сині чорнила, які більше ніколи не з'явилися...`;
        coverEl.style.backgroundImage = "url('../../../../.gemini/antigravity-ide/brain/dea9a842-87b9-4df7-bb40-2aeafece7ec5/anna_library_1782328818809.png')";
        
        // Play melancholy tune
        setTimeout(() => playMelancholyTune(), 500);
    } else {
        titleEl.textContent = "Крок у невідоме";
        descEl.innerHTML = `Анна робить глибокий вдих і робить крок углиб сяючого алхімічного дзеркала. Холодний вихор обволікає її тіло...<br><br>
        З тихим дзвоном вона падає на тверду кам'яну підлогу. Навколо пахне воском, пилом та сіркою.
        Вона бачить перед собою переляканого, але щасливого Макса. Варта якраз вибиває двері кабінету, але тепер вони разом. 
        Використовуючи сучасні знання Анни про таємні ходи маєтку, вони втікають через таємний вихід підвалу в нічну темряву 1888 року.
        На її шиї сяє той самий золотий кулон, який Макс знайшов у ніші. Вона залишилася в минулому заради кохання, назавжди змінивши хід історії роду.`;
        coverEl.style.backgroundImage = "url('../../../../.gemini/antigravity-ide/brain/dea9a842-87b9-4df7-bb40-2aeafece7ec5/max_study_1782328830355.png')";
        
        // Play triumphant/romantic tune
        setTimeout(() => playTriumphantTune(), 500);
    }
}

function playMelancholyTune() {
    if (!state.audioEnabled || !audioCtx) return;
    const notes = [220, 207.65, 196, 174.61, 164.81]; // Melancholy descending path
    notes.forEach((freq, i) => {
        setTimeout(() => {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.5);
        }, i * 400);
    });
}

function playTriumphantTune() {
    if (!state.audioEnabled || !audioCtx) return;
    const notes = [261.63, 329.63, 392.0, 440.0, 523.25]; // Rising romantic arpeggio
    notes.forEach((freq, i) => {
        setTimeout(() => {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.8);
        }, i * 250);
    });
}

// Reset Game State
function restartGame() {
    state.trust = 0;
    state.currentStep = 'intro';
    state.typewriterActive = false;
    
    // Update trust bar display directly (avoid updateTrust adding to 0)
    document.getElementById('trust-bar-fill').style.width = '0%';
    document.getElementById('trust-value').textContent = '0%';
    
    // Clear logs
    document.getElementById('anna-log').innerHTML = '';
    document.getElementById('max-log').innerHTML = '';
    
    // Clear options
    document.getElementById('options-container').innerHTML = '';
    document.getElementById('narrative-text').textContent = '';
    
    // Reset puzzle to shuffled order and clear feedback
    const container = document.getElementById('symbols-container');
    const shuffledOrder = ['star', 'moon', 'sun', 'comet'];
    shuffledOrder.forEach(id => {
        const node = container.querySelector(`[data-id="${id}"]`);
        if (node) {
            node.classList.remove('active-symbol');
            container.appendChild(node);
        }
    });
    document.getElementById('puzzle-feedback').textContent = '';
    document.getElementById('puzzle-feedback').className = 'puzzle-feedback';
    
    // Reset layout
    document.getElementById('era-max').style.flexGrow = '1';
    document.getElementById('era-anna').style.flexGrow = '1';
    
    // Hide all screens, show title
    document.getElementById('puzzle-modal').classList.add('hidden');
    document.getElementById('portal-screen').classList.add('hidden');
    document.getElementById('ending-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('title-screen').style.opacity = 1;
    
    // Cancel portal animation if running
    if (portalAnimationId) {
        cancelAnimationFrame(portalAnimationId);
        portalAnimationId = null;
    }
}

// --- INTERACTIVE MOUSE PARALLAX / FLASHLIGHT ON ANNA SIDE ---
const eraAnnaEl = document.getElementById('era-anna');
eraAnnaEl.addEventListener('mousemove', (e) => {
    const rect = eraAnnaEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    document.getElementById('flashlight').style.setProperty('--flashlight-x', `${x}px`);
    document.getElementById('flashlight').style.setProperty('--flashlight-y', `${y}px`);
});

// Touch support for flashlight on mobile
eraAnnaEl.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const rect = eraAnnaEl.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        document.getElementById('flashlight').style.setProperty('--flashlight-x', `${x}px`);
        document.getElementById('flashlight').style.setProperty('--flashlight-y', `${y}px`);
    }
});

// --- LANDING PAGE LOGIC ---

// Launch & Exit Demo Game
function launchDemo() {
    const container = document.getElementById('demo-game-container');
    container.classList.remove('hidden');
    document.body.classList.add('demo-active');
    restartGame();
}

function exitDemo() {
    const container = document.getElementById('demo-game-container');
    container.classList.add('hidden');
    document.body.classList.remove('demo-active');
    
    // Mute/stop audio if it was running
    if (state.audioEnabled) {
        toggleSound();
    }
}

// Particle Effect Generator (Hearts/Bubbles)
function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random styling
            const size = Math.random() * 15 + 5; // 5px to 20px
            const left = Math.random() * 100; // 0% to 100%
            const duration = Math.random() * 8 + 6; // 6s to 14s
            const delay = Math.random() * 5;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            // Set colors randomly between accent pink and cyan
            if (Math.random() > 0.6) {
                particle.style.background = 'rgba(0, 240, 255, 0.15)';
                particle.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.3)';
            } else {
                particle.style.background = 'rgba(255, 42, 116, 0.15)';
                particle.style.boxShadow = '0 0 8px rgba(255, 42, 116, 0.3)';
            }
            
            container.appendChild(particle);
            
            // Remove after animation completes to free memory
            particle.addEventListener('animationend', () => {
                particle.remove();
                // Spawn a new one to keep count
                spawnOneParticle();
            });
        }, i * 300);
    }
}

function spawnOneParticle() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 15 + 5;
    const left = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.animationDuration = `${duration}s`;
    
    if (Math.random() > 0.6) {
        particle.style.background = 'rgba(0, 240, 255, 0.15)';
        particle.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.3)';
    } else {
        particle.style.background = 'rgba(255, 42, 116, 0.15)';
        particle.style.boxShadow = '0 0 8px rgba(255, 42, 116, 0.3)';
    }
    
    container.appendChild(particle);
    particle.addEventListener('animationend', () => {
        particle.remove();
        spawnOneParticle();
    });
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Scroll Reveal Observer
document.addEventListener('DOMContentLoaded', () => {
    // Generate particles
    createParticles();
    
    // Setup scroll reveal
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        threshold: 0.1
    });
    
    revealElements.forEach(el => observer.observe(el));
    
    // FAQ Accordions
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
    
    // Mobile Navigation Menu Toggle
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            // If active, open menu
            if (mobileToggle.classList.contains('active')) {
                navMenu.style.display = 'flex';
                navMenu.style.position = 'absolute';
                navMenu.style.top = 'var(--navbar-height)';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.flexDirection = 'column';
                navMenu.style.background = 'rgba(13, 7, 29, 0.98)';
                navMenu.style.padding = '20px';
                navMenu.style.borderBottom = '1px solid rgba(255, 42, 116, 0.2)';
                navMenu.style.backdropFilter = 'blur(15px)';
            } else {
                navMenu.removeAttribute('style');
            }
        });
        
        // Close menu when clicking link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.removeAttribute('style');
            });
        });
    }
});

// Event Listeners for Game Buttons
document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('sound-btn').addEventListener('click', toggleSound);
document.getElementById('restart-game-btn').addEventListener('click', restartGame);
document.getElementById('exit-demo-btn').addEventListener('click', exitDemo);

window.addEventListener('resize', () => {
    // Redraw portal canvas on resize if active
    const canvas = document.getElementById('portal-canvas');
    if (canvas && !document.getElementById('portal-screen').classList.contains('hidden')) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
