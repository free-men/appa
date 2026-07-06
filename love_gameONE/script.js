/**
 * Love in the Chalk Tunnels - Visual Novel Engine
 * Built for premium aesthetics and immersive programmatic audio.
 */

// Web Audio API Synthesizer Engine
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.ambientGain = null;
        this.synthGain = null;
        this.windFilter = null;
        this.rumbleOsc = null;
        this.isMuted = false;
        this.volume = 0.2; // Default 20%
        this.heartbeatTimer = null;
        this.melodyTimer = null;
        this.melodyNotes = [];
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Gain Nodes
        this.ambientGain = this.ctx.createGain();
        this.synthGain = this.ctx.createGain();
        
        const initAmbientVol = this.isMuted ? 0 : this.volume * 0.4;
        const initSynthVol = this.isMuted ? 0 : this.volume * 0.6;
        
        this.ambientGain.gain.setValueAtTime(initAmbientVol, this.ctx.currentTime);
        this.synthGain.gain.setValueAtTime(initSynthVol, this.ctx.currentTime);
        
        this.ambientGain.connect(this.ctx.destination);
        this.synthGain.connect(this.ctx.destination);
        
        this.startCalmMelody();

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(value) {
        this.volume = value / 100;
        if (this.isMuted) return;
        
        if (this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(this.volume * 0.4, this.ctx.currentTime + 0.1);
        }
        if (this.synthGain) {
            this.synthGain.gain.linearRampToValueAtTime(this.volume * 0.6, this.ctx.currentTime + 0.1);
        }
    }

    mute() {
        this.isMuted = true;
        if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.synthGain) this.synthGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }

    unmute() {
        this.isMuted = false;
        this.setVolume(this.volume * 100);
    }

    // Creates a gentle, calm ambient melody using pentatonic scale
    startCalmMelody() {
        if (!this.ctx) return;

        // Pentatonic scale notes for a dreamy, calm feel (C4-based)
        const scale = [
            261.63, // C4
            293.66, // D4
            329.63, // E4
            392.00, // G4
            440.00, // A4
            523.25, // C5
            587.33, // D5
            659.25  // E5
        ];

        // Soft pad drone for warmth
        const padOsc1 = this.ctx.createOscillator();
        const padOsc2 = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        const padFilter = this.ctx.createBiquadFilter();

        padOsc1.type = 'sine';
        padOsc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
        padOsc2.type = 'sine';
        padOsc2.frequency.setValueAtTime(196.00, this.ctx.currentTime); // G3

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
        padFilter.Q.setValueAtTime(0.5, this.ctx.currentTime);

        padGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        padOsc1.connect(padFilter);
        padOsc2.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.ambientGain);

        padOsc1.start();
        padOsc2.start();

        // Play gentle melody notes in a loop
        let noteIndex = 0;
        const playMelodyNote = () => {
            if (!this.ctx || this.isMuted) {
                this.melodyTimer = setTimeout(playMelodyNote, 2000);
                return;
            }

            const time = this.ctx.currentTime;
            const freq = scale[noteIndex % scale.length];
            noteIndex++;

            // Main note (sine — soft and clean)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, time);

            // Gentle envelope: slow attack, long sustain, soft release
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.3);
            gain.gain.linearRampToValueAtTime(0.06, time + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambientGain);

            osc.start(time);
            osc.stop(time + 2.6);

            // Harmony note (a fifth or octave above, very quiet)
            const harmOsc = this.ctx.createOscillator();
            const harmGain = this.ctx.createGain();
            harmOsc.type = 'sine';
            harmOsc.frequency.setValueAtTime(freq * 1.5, time); // Perfect fifth
            harmGain.gain.setValueAtTime(0, time);
            harmGain.gain.linearRampToValueAtTime(0.04, time + 0.5);
            harmGain.gain.exponentialRampToValueAtTime(0.001, time + 2.2);

            harmOsc.connect(harmGain);
            harmGain.connect(this.ambientGain);
            harmOsc.start(time);
            harmOsc.stop(time + 2.3);

            // Schedule next note with gentle timing variation
            const nextDelay = 1800 + Math.random() * 1200; // 1.8s - 3.0s
            this.melodyTimer = setTimeout(playMelodyNote, nextDelay);
        };

        // Start melody after a short pause
        this.melodyTimer = setTimeout(playMelodyNote, 1000);
    }

    // Play high-fidelity musical chime when user makes progress
    playChime() {
        if (!this.ctx || this.isMuted) return;
        
        const time = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + index * 0.1);
            
            gain.gain.setValueAtTime(0, time + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.15, time + index * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + index * 0.1 + 0.8);
            
            osc.connect(gain);
            gain.connect(this.synthGain);
            
            osc.start(time + index * 0.1);
            osc.stop(time + index * 0.1 + 0.9);
        });
    }

    // Deep spooky heartbeat for tense moments
    startHeartbeat() {
        if (this.heartbeatTimer) return;
        
        const beat = () => {
            if (!this.ctx || this.isMuted) return;
            const time = this.ctx.currentTime;
            
            const playThump = (delay) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(55, time + delay);
                osc.frequency.exponentialRampToValueAtTime(10, time + delay + 0.15);
                
                gain.gain.setValueAtTime(0, time + delay);
                gain.gain.linearRampToValueAtTime(0.4, time + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.18);
                
                osc.connect(gain);
                gain.connect(this.synthGain);
                
                osc.start(time + delay);
                osc.stop(time + delay + 0.2);
            };
            
            playThump(0);
            playThump(0.22); // Second thump of heartbeat
            
            this.heartbeatTimer = setTimeout(beat, 1100); // 55 BPM
        };
        
        beat();
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // Play warning/spooky metal scrape
    playSpookySwell() {
        if (!this.ctx || this.isMuted) return;
        
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 2.5);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(102, this.ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(58, this.ctx.currentTime + 2.5);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthGain);
        
        osc.start();
        osc2.start();
        osc.stop(this.ctx.currentTime + 2.6);
        osc2.stop(this.ctx.currentTime + 2.6);
    }
}

// Game Script Database (Branching Choices & Dialogues)
const STORY_SCRIPT = {
    // START SCENE
    intro_1: {
        speaker: "Оповідач",
        text: "Хелмські крейдяні підземелля зустрічають вас холодною тишею. Тут, на глибині кількох десятків метрів, час ніби зупинився. Лише ваші кроки лунають у білих коридорах.",
        bg: "assets/tunnels_entrance.png",
        next: "intro_2"
    },
    intro_2: {
        speaker: "Оповідач",
        text: "Ви прийшли сюди удвох. Макс хотів показати Соломії це містичне місце, про яке давно ходили дивні чутки... Проте зараз ви стоїте біля самого входу, вагаючись перед невідомим.",
        bg: "assets/tunnels_entrance.png",
        next: "intro_3"
    },
    intro_3: {
        speaker: "narrator_char", // Dynamic based on character
        text: "Сьогодні особливий день. Повітря вологе, пахне крейдою та давниною. Потрібно зробити перший крок.",
        bg: "assets/tunnels_entrance.png",
        choices: [
            {
                text: "Взяти кохану людину за руку та впевнено зайти.",
                next: "entrance_trust",
                action: (state) => {
                    state.trustPoints += 2;
                }
            },
            {
                text: "Пожартувати про підземних монстрів і побігти вперед.",
                next: "entrance_courage",
                action: (state) => {
                    state.trustPoints -= 1;
                    state.choicesMade.push("joked_monsters");
                }
            }
        ]
    },
    entrance_trust: {
        speaker: "narrator_char",
        text: "Ви відчуваєте тепло долоні. Це дає спокій та впевненість. Темрява попереду більше не здається такою загрозливою. Ви крокуєте вглиб лабіринту.",
        bg: "assets/tunnels_entrance.png",
        next: "labyrinth_split"
    },
    entrance_courage: {
        speaker: "narrator_char",
        text: "Сміх відлунює від білих стін. Ви біжите вперед, залишаючи іншого позаду. Але веселощі швидко згасають, коли тіні довкола видовжуються.",
        bg: "assets/tunnels_entrance.png",
        next: "labyrinth_split"
    },

    // LABYRINTH SPLIT
    labyrinth_split: {
        speaker: "Оповідач",
        text: "Коридор звужується. Крейдяні стіни стають ближчими, а стеля — нижчою. Раптом попереду ви бачите розгалуження тунелю на дві темні галереї.",
        bg: "assets/tunnels_entrance.png",
        choices: [
            {
                text: "Піти ліворуч, де тунель здається ширшим.",
                next: "path_left"
            },
            {
                text: "Піти праворуч, орієнтуючись на ледь помітне світіння.",
                next: "path_right"
            }
        ]
    },

    // LEFT PATH (Trouble / Flashlight or Coin find)
    path_left: {
        speaker: "Оповідач",
        text: "Ви завертаєте ліворуч. Раптом зверху осипається дрібна крейдяна крихта. Звук глухого удару! Стара дерев'яна перегородка позаду вас підкошується і з гуркотом падає!",
        bg: "assets/tunnels_entrance.png",
        event: "spooky_swell",
        next: "separation_scene"
    },
    path_right: {
        speaker: "Оповідач",
        text: "Ви йдете на слабке світло. Під ногами щось блищить у шарі пилу. Це старовинна монета із зображенням герба міста Хелм!",
        bg: "assets/tunnels_entrance.png",
        action: (state) => {
            if (!state.inventory.includes("Старовинна Монета")) {
                state.inventory.push("Старовинна Монета");
            }
        },
        next: "separation_event"
    },

    // SEPARATION EVENT
    separation_event: {
        speaker: "Оповідач",
        text: "Доки ви роздивляєтеся монету, зненацька підіймається густий, холодний туман. Він огортає вас за лічені секунди. Ви простягаєте руку, але бачите лише суцільну білу стіну.",
        bg: "assets/tunnels_entrance.png",
        event: "spooky_swell",
        next: "separation_scene"
    },

    separation_scene: {
        speaker: "narrator_char",
        text: "«Ау! Ти де?!» — кричите ви в темряву. Але у відповідь чути лише глухе відлуння власного голосу. Ви залишилися наодинці з цими білими стінами. Потрібно діяти швидко.",
        bg: "assets/tunnels_entrance.png",
        event: "heartbeat_start",
        choices: [
            {
                text: "Мацати стіни в темряві та шукати дорогу навмання.",
                next: "lost_darkness"
            },
            {
                text: "Спробувати скористатися тим, що є у вашій кишені.",
                next: "use_item_scene"
            }
        ]
    },

    lost_darkness: {
        speaker: "Оповідач",
        text: "Ви блукаєте годинами... чи, можливо, це лише хвилини? Час втратив сенс. Темрява здається живою, а стіни стискаються. Ваші сили вичерпуються.",
        bg: "assets/tunnels_entrance.png",
        next: "lost_ending"
    },

    use_item_scene: {
        speaker: "narrator_char",
        text: "Ви перевіряєте свої речі. На щастя, ви знаходите засіб знайти шлях у темряві.",
        bg: "assets/tunnels_entrance.png",
        action: (state) => {
            if (state.character === 'max') {
                if (!state.inventory.includes("Ліхтарик")) {
                    state.inventory.push("Ліхтарик");
                }
            } else if (state.character === 'julia') {
                if (!state.inventory.includes("Шматочок крейди")) {
                    state.inventory.push("Шматочок крейди");
                }
            }
        },
        choices: [
            {
                text: "Увімкнути Ліхтарик (якщо ви Макс) або розтерти шматочок крейди для маркування шляху (якщо ви Соломія).",
                next: "ghost_encounter"
            }
        ]
    },

    // GHOST ENCOUNTER
    ghost_encounter: {
        speaker: "Оповідач",
        text: "Коли темряву прорізає промінь світла (або коли ви залишаєте білі крейдяні знаки), повітря навколо раптово стає крижаним. Світло починає пульсувати ніжним сріблястим сяйвом. Посеред коридору матеріалізується напівпрозора біла постать духа.",
        bg: "assets/ghost_bieluch.png",
        event: "heartbeat_stop",
        next: "ghost_talk_1"
    },

    ghost_talk_1: {
        speaker: "Привид Білух",
        text: "Вітаю вас, смертні. Я — Білух, хранитель цих крейдяних глибин. Ви принесли занепокоєння у мій дім, а ваші серця розділені страхом та відстанню. Чому я маю допомогти вам знайти одне одного?",
        bg: "assets/ghost_bieluch.png",
        choices: [
            {
                text: "Спробувати захиститися та вимагати виходу.",
                next: "ghost_angry"
            },
            {
                text: "Вклонитися і попросити про допомогу в ім'я любові.",
                next: "ghost_riddle_intro",
                action: (state) => {
                    state.trustPoints += 2;
                }
            }
        ]
    },

    ghost_angry: {
        speaker: "Привид Білух",
        text: "Зухвалість не вітається під цим склепінням. Я залишу вас наодинці з вашою гординею. Нехай стіни вчать вас поваги.",
        bg: "assets/ghost_bieluch.png",
        next: "lost_ending"
    },

    ghost_riddle_intro: {
        speaker: "Привид Білух",
        text: "Любов — сильне слово, але чи вмієте ви слухати серце? Я поставлю вам загадку. Якщо відповісте вірно — я вкажу шлях. Якщо ні — ви назавжди залишитесь блукати цими лабіринтами.",
        bg: "assets/ghost_bieluch.png",
        next: "ghost_riddle"
    },

    ghost_riddle: {
        speaker: "Привид Білух",
        text: "Слухайте уважно: «Мене не можна купити, не можна продати, але можна подарувати. Я роблю найбіднішого багатим, а без мене навіть королі почуваються нещасними. Що це?»",
        bg: "assets/ghost_bieluch.png",
        choices: [
            {
                text: "Це Золото.",
                next: "ghost_riddle_fail"
            },
            {
                text: "Це Кохання.",
                next: "ghost_riddle_success",
                action: (state) => {
                    state.trustPoints += 3;
                }
            },
            {
                text: "Це Свобода.",
                next: "ghost_riddle_fail"
            }
        ]
    },

    ghost_riddle_fail: {
        speaker: "Привид Білух",
        text: "Ні... Ваші думки надто матеріальні або далекі від істини. Можливо, серце ще не готове до справжнього почуття.",
        bg: "assets/ghost_bieluch.png",
        choices: [
            {
                text: "Благати про другий шанс та запропонувати щось натомість.",
                next: "ghost_second_chance"
            },
            {
                text: "Зневіритися та опустити руки.",
                next: "lost_ending"
            }
        ]
    },

    ghost_second_chance: {
        speaker: "Привид Білух",
        text: "Я бачу відчай у ваших очах. Чи є у вас щось, що символізує вашу щирість та повагу до цих підземель?",
        bg: "assets/ghost_bieluch.png",
        choices: [
            {
                text: "Запропонувати Старовинну Монету (якщо вона є в рюкзаку).",
                next: "ghost_give_coin",
                condition: (state) => state.inventory.includes("Старовинна Монета")
            },
            {
                text: "Нам нічого запропонувати...",
                next: "lost_ending"
            }
        ]
    },

    ghost_give_coin: {
        speaker: "Привид Білух",
        text: "О! Ця монета пам'ятає часи, коли Хелм тільки будувався. Ти виявив повагу до історії мого дому. Я приймаю твій дар. Нехай світло вкаже дорогу.",
        bg: "assets/ghost_bieluch.png",
        action: (state) => {
            // Remove coin from inventory
            state.inventory = state.inventory.filter(item => item !== "Старовинна Монета");
            state.inventory.push("Благословення Білуха");
        },
        next: "reunion_path"
    },

    ghost_riddle_success: {
        speaker: "Привид Білух",
        text: "Правильно. Саме любов є тим скарбом, який ви шукаєте тут і в житті. Бачу, що ваші серця б'ються в унісон, навіть коли ви розділені білою крейдою.",
        bg: "assets/ghost_bieluch.png",
        next: "ghost_gift"
    },

    ghost_gift: {
        speaker: "Привид Білух",
        text: "Я відкрию для вас таємний коридор, який веде до Зали Закоханих. Ідіть на тепле сяйво і нічого не бійтеся.",
        bg: "assets/ghost_bieluch.png",
        action: (state) => {
            state.inventory.push("Благословення Білуха");
        },
        next: "reunion_path"
    },

    // REUNION & ENDING
    reunion_path: {
        speaker: "Оповідач",
        text: "Стіна ліворуч беззвучно відсувається, відкриваючи прохід, залитий м'яким, теплим світлом. Ви біжите вперед по білому піску тунелю. Повітря стає теплішим, а серце калатає від радості.",
        bg: "assets/tunnels_entrance.png",
        next: "reunion_kiss"
    },

    reunion_kiss: {
        speaker: "Оповідач",
        text: "Нарешті! Посеред великої зали ви бачите знайомий силует. Ви біжите назустріч одне одному, забувши про страх, привидів та темряву. Весь світ навколо зникає.",
        bg: "assets/couple_kiss.png",
        choices: [
            {
                text: "Міцно обійняти та поцілувати.",
                next: "final_ending_calculation"
            }
        ]
    },

    // ENDINGS DECISION
    final_ending_calculation: {
        speaker: "Оповідач",
        text: "Ваша пригода в Хелмських крейдяних підземеллях добігла кінця. Настав час дізнатися, як ця подорож змінила вашу долю...",
        bg: "assets/couple_kiss.png",
        action: (state) => {
            // Evaluates ending
            if (state.inventory.includes("Благословення Білуха") && state.trustPoints >= 4) {
                state._calculatedEnding = "ending_true_love";
            } else if (state.trustPoints > 1) {
                state._calculatedEnding = "ending_normal";
            } else {
                state._calculatedEnding = "ending_friendship";
            }
        },
        choices: [
            {
                text: "Дізнатися свою долю...",
                next: "ending_normal",
                action: (state) => {
                    // Override next with the calculated ending
                    state.sceneId = state._calculatedEnding || "ending_normal";
                }
            }
        ]
    },

    ending_true_love: {
        speaker: "Щасливий Фінал: Вічне Кохання",
        text: "Ви пройшли всі випробування Білуха! Ваше кохання виявилося міцнішим за крейдяні скелі. Отримавши благословення доброго духа підземелля, ви вийшли на світло міцно тримаючись за руки. Цей день назавжди залишиться символом вашого вічного союзу. Дякуємо за гру!",
        bg: "assets/couple_kiss.png",
        choices: [
            {
                text: "Повернутися в головне меню",
                next: "main_menu_reset"
            }
        ]
    },

    ending_normal: {
        speaker: "Фінал: Вихід до Світла",
        text: "Ви успішно вибралися з тунелів і знайшли одне одного. Хоч ви й пережили переляк, ви раді бути разом знову. Проте підземелля залишили легкий осад таємничості у ваших душах. Ви стали ближчими, але попереду ще багато викликів. Дякуємо за гру!",
        bg: "assets/couple_kiss.png",
        choices: [
            {
                text: "Повернутися в головне меню",
                next: "main_menu_reset"
            }
        ]
    },

    ending_friendship: {
        speaker: "Фінал: Холодні Тіні",
        text: "Ви вибралися, але страх і егоїзм під час блукань залишили глибокий слід. Поцілунок здався холодним, а стіни тунелів ніби розділили ваші серця назавжди. Ви вийшли на світло разом, але зрозуміли, що ваші шляхи далі розходяться. Дякуємо за гру!",
        bg: "assets/tunnels_entrance.png",
        choices: [
            {
                text: "Повернутися в головне меню",
                next: "main_menu_reset"
            }
        ]
    },

    lost_ending: {
        speaker: "Сумний Фінал: Втрачені в Лабіринті",
        text: "Ваші голоси стихли в нескінченних білих лабіринтах. Ви зробили неправильні вибори, піддалися паніці чи розлютили духа підземелля. Хелмські крейдяні тунелі надійно зберігають свої таємниці... і тих, хто не зміг їх розгадати. Спробуйте ще раз!",
        bg: "assets/tunnels_entrance.png",
        choices: [
            {
                text: "Спробувати знову",
                next: "main_menu_reset"
            }
        ]
    }
};

// Game State Management
const Game = {
    state: {
        character: null,      // 'max' or 'julia'
        sceneId: 'intro_1',
        inventory: [],
        choicesMade: [],
        trustPoints: 0,
        riddleAttempts: 0
    },

    audio: new AudioEngine(),
    textSpeed: 40, // Typewriter speed (ms per character)
    typingTimer: null,
    isTyping: false,
    currentTypeText: "",

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadSettings();
        this.preloadAssets();
        this.loadSaveSlotsInfo();
        this.checkAutoSave();
    },

    cacheDOM() {
        this.dom = {
            preloader: document.getElementById('preloader'),
            gameContainer: document.getElementById('game-container'),
            bgViewport: document.getElementById('bg-viewport'),
            audioIndicator: document.getElementById('audio-indicator'),
            
            // Buttons
            btnQuickSave: document.getElementById('btn-quick-save'),
            btnQuickLoad: document.getElementById('btn-quick-load'),
            btnMenuSave: document.getElementById('btn-menu-save'),
            btnMenuSettings: document.getElementById('btn-menu-settings'),
            btnToggleSound: document.getElementById('btn-toggle-sound'),
            
            // Screen containers
            mainMenu: document.getElementById('main-menu'),
            charSelection: document.getElementById('char-selection'),
            storyViewport: document.getElementById('story-viewport'),
            
            // Menu Buttons
            btnContinueGame: document.getElementById('btn-continue-game'),
            btnStartGame: document.getElementById('btn-start-game'),
            btnLoadMenu: document.getElementById('btn-load-menu'),
            btnOpenGallery: document.getElementById('btn-open-gallery'),
            btnOpenSettings: document.getElementById('btn-open-settings'),
            btnAbout: document.getElementById('btn-about'),
            
            // Character Selection
            charMax: document.getElementById('char-max'),
            charJulia: document.getElementById('char-julia'),
            btnCharBack: document.getElementById('btn-char-back'),
            btnCharConfirm: document.getElementById('btn-char-confirm'),
            
            // Story UI
            portraitLeft: document.getElementById('portrait-left'),
            portraitRight: document.getElementById('portrait-right'),
            speakerBadge: document.getElementById('speaker-badge'),
            dialogueBox: document.getElementById('dialogue-box'),
            dialogueText: document.getElementById('dialogue-text'),
            clickPrompt: document.getElementById('click-prompt'),
            choicesContainer: document.getElementById('choices-container'),
            inventoryItems: document.getElementById('inventory-items'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            saveloadModal: document.getElementById('saveload-modal'),
            aboutModal: document.getElementById('about-modal'),
            galleryModal: document.getElementById('gallery-modal'),
            
            btnCloseSettings: document.getElementById('btn-close-settings'),
            btnCloseSaveload: document.getElementById('btn-close-saveload'),
            btnCloseAbout: document.getElementById('btn-close-about'),
            btnCloseGallery: document.getElementById('btn-close-gallery'),
            
            // Settings Sliders
            sliderTextSpeed: document.getElementById('slider-text-speed'),
            sliderAmbientVolume: document.getElementById('slider-ambient-volume'),
            valTextSpeed: document.getElementById('val-text-speed'),
            valAmbientVolume: document.getElementById('val-ambient-volume'),
            btnClearSave: document.getElementById('btn-clear-save'),
            
            saveloadTitle: document.getElementById('saveload-title')
        };
    },

    bindEvents() {
        // Main Menu Actions
        this.dom.btnContinueGame.addEventListener('click', () => {
            const data = localStorage.getItem('game_love_autosave');
            if (data) {
                this.state = JSON.parse(data);
                this.audio.init();
                this.showScreen(this.dom.storyViewport);
                this.renderScene();
            }
        });

        this.dom.btnStartGame.addEventListener('click', () => {
            this.audio.init();
            this.showScreen(this.dom.charSelection);
        });

        this.dom.btnLoadMenu.addEventListener('click', () => {
            this.audio.init();
            this.openSaveLoadModal(false); // Mode load
        });

        this.dom.btnOpenGallery.addEventListener('click', () => {
            this.audio.init();
            this.loadGallery();
            this.dom.galleryModal.classList.remove('hidden');
        });

        this.dom.btnOpenSettings.addEventListener('click', () => {
            this.audio.init();
            this.dom.settingsModal.classList.remove('hidden');
        });

        this.dom.btnAbout.addEventListener('click', () => {
            this.dom.aboutModal.classList.remove('hidden');
        });

        // Character Selection
        this.dom.charMax.addEventListener('click', () => this.selectCharacter('max'));
        this.dom.charJulia.addEventListener('click', () => this.selectCharacter('julia'));
        this.dom.btnCharBack.addEventListener('click', () => this.showScreen(this.dom.mainMenu));
        this.dom.btnCharConfirm.addEventListener('click', () => this.startGameAdventure());

        // Quick Controls
        this.dom.btnQuickSave.addEventListener('click', () => this.quickSave());
        this.dom.btnQuickLoad.addEventListener('click', () => this.quickLoad());
        this.dom.btnMenuSave.addEventListener('click', () => this.openSaveLoadModal(true));
        this.dom.btnMenuSettings.addEventListener('click', () => this.dom.settingsModal.classList.remove('hidden'));
        
        this.dom.btnToggleSound.addEventListener('click', () => {
            this.toggleSound();
            this.saveSettings();
        });

        // Dialogue Progression on Box Click
        this.dom.dialogueBox.addEventListener('click', () => this.onDialogueBoxClick());

        // Modals Closes
        this.dom.btnCloseSettings.addEventListener('click', () => this.dom.settingsModal.classList.add('hidden'));
        this.dom.btnCloseSaveload.addEventListener('click', () => this.dom.saveloadModal.classList.add('hidden'));
        this.dom.btnCloseAbout.addEventListener('click', () => this.dom.aboutModal.classList.add('hidden'));
        this.dom.btnCloseGallery.addEventListener('click', () => this.dom.galleryModal.classList.add('hidden'));

        // Settings events
        this.dom.sliderTextSpeed.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.textSpeed = 90 - val; // Reverse value to make higher value faster
            this.dom.valTextSpeed.innerText = val > 60 ? "Швидко" : val < 30 ? "Повільно" : "Нормально";
            this.saveSettings();
        });

        this.dom.sliderAmbientVolume.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.dom.valAmbientVolume.innerText = val + "%";
            this.audio.setVolume(val);
            this.saveSettings();
        });

        this.dom.btnClearSave.addEventListener('click', () => {
            if (confirm("Ви дійсно хочете скинути всі збереження? Цю дію неможливо скасувати.")) {
                localStorage.clear();
                this.loadSaveSlotsInfo();
                this.checkAutoSave();
                this.loadGallery();
                alert("Всі збереження видалено.");
            }
        });

        // Save slot action delegations
        document.querySelectorAll('.save-slot').forEach(slotEl => {
            const slotNum = slotEl.getAttribute('data-slot');
            const saveBtn = slotEl.querySelector('.action-save');
            const loadBtn = slotEl.querySelector('.action-load');

            saveBtn.addEventListener('click', () => this.saveToSlot(slotNum));
            loadBtn.addEventListener('click', () => this.loadFromSlot(slotNum));
        });

        // Keyboard support (Space/Enter to progress text)
        document.addEventListener('keydown', (e) => {
            if (this.dom.storyViewport.classList.contains('hidden')) return;
            if (this.dom.settingsModal.classList.contains('hidden') === false) return;
            if (this.dom.saveloadModal.classList.contains('hidden') === false) return;
            
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.onDialogueBoxClick();
            }
        });
    },

    preloadAssets() {
        // Preload existing assets
        const assets = [
            'assets/tunnels_entrance.png',
            'assets/ghost_bieluch.png',
            'assets/couple_kiss.png'
        ];

        let loadedCount = 0;
        assets.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === assets.length) {
                    setTimeout(() => {
                        this.dom.preloader.classList.add('fade-out');
                    }, 500);
                }
            };
            img.onerror = () => {
                loadedCount++; // Avoid blocking if file issue
                if (loadedCount === assets.length) {
                    this.dom.preloader.classList.add('fade-out');
                }
            };
        });
    },

    showScreen(screen) {
        // Hide all screens
        this.dom.mainMenu.classList.add('hidden');
        this.dom.charSelection.classList.add('hidden');
        this.dom.storyViewport.classList.add('hidden');

        // Remove active class
        this.dom.mainMenu.classList.remove('active');
        this.dom.charSelection.classList.remove('active');
        this.dom.storyViewport.classList.remove('active');

        // Show targets
        screen.classList.remove('hidden');
        screen.classList.add('active');

        // Toggle visibility of gameplay-only controls
        if (this.dom.btnQuickSave) {
            if (screen === this.dom.storyViewport) {
                this.dom.btnQuickSave.classList.remove('hidden');
                this.dom.btnQuickLoad.classList.remove('hidden');
                this.dom.btnMenuSave.classList.remove('hidden');
            } else {
                this.dom.btnQuickSave.classList.add('hidden');
                this.dom.btnQuickLoad.classList.add('hidden');
                this.dom.btnMenuSave.classList.add('hidden');
            }
        }
    },

    selectCharacter(char) {
        this.state.character = char;
        this.dom.charMax.classList.remove('selected');
        this.dom.charJulia.classList.remove('selected');

        if (char === 'max') {
            this.dom.charMax.classList.add('selected');
        } else {
            this.dom.charJulia.classList.add('selected');
        }

        this.dom.btnCharConfirm.classList.remove('disabled');
        this.dom.btnCharConfirm.removeAttribute('disabled');
        
        // Synthesize selection audio feedback
        this.audio.playChime();
    },

    startGameAdventure() {
        this.state.sceneId = 'intro_1';
        this.state.choicesMade = [];
        this.state.trustPoints = 0;
        this.state.riddleAttempts = 0;

        // Initialize starting items according to character bios
        if (this.state.character === 'max') {
            this.state.inventory = ["Ліхтарик"];
        } else if (this.state.character === 'julia') {
            this.state.inventory = ["Блокнот", "Старовинна Монета"];
        } else {
            this.state.inventory = [];
        }

        this.showScreen(this.dom.storyViewport);
        this.renderScene();
    },

    renderScene() {
        const scene = STORY_SCRIPT[this.state.sceneId];
        if (!scene) return;

        // Apply background
        if (scene.bg) {
            this.dom.bgViewport.style.backgroundImage = `url('${scene.bg}')`;
        }

        // Apply audio events
        if (scene.event) {
            this.handleAudioEvent(scene.event);
        }

        // Apply actions if any
        if (scene.action) {
            scene.action(this.state);
        }

        // Auto Save progress
        this.autoSave();

        // Unlock gallery ending if reached
        if (this.state.sceneId === 'ending_true_love') {
            localStorage.setItem('game_love_ending_true_love', 'true');
        } else if (this.state.sceneId === 'ending_normal') {
            localStorage.setItem('game_love_ending_normal', 'true');
        } else if (this.state.sceneId === 'ending_friendship') {
            localStorage.setItem('game_love_ending_friendship', 'true');
        } else if (this.state.sceneId === 'lost_ending') {
            localStorage.setItem('game_love_ending_lost', 'true');
        }

        // Update speaker badge
        let speakerName = scene.speaker;
        
        // Resolve dynamic speaker names
        if (speakerName === "narrator_char") {
            speakerName = this.state.character === 'max' ? "Макс" : "Соломія";
        }
        
        if (speakerName === "Оповідач" || !speakerName) {
            this.dom.speakerBadge.classList.add('hidden');
        } else {
            this.dom.speakerBadge.innerText = speakerName;
            this.dom.speakerBadge.classList.remove('hidden');
        }

        // Handle character portraits
        this.updatePortraits(speakerName, scene.bg);

        // Update Inventory UI
        this.updateInventoryUI();

        // Dialogue Box configuration
        this.dom.choicesContainer.classList.add('hidden');
        this.dom.clickPrompt.classList.add('hidden');

        // Extract story text
        let dialogueText = scene.text;
        if (scene.speaker === "narrator_char") {
            // Personalize text based on active character
            if (this.state.character === 'max') {
                if (this.state.sceneId === 'intro_3') {
                    dialogueText = "Сьогодні особливий день. Я привів Соломію в тунелі, але прохолода змушує серце битися швидше. Треба зробити перший крок.";
                } else if (this.state.sceneId === 'entrance_trust') {
                    dialogueText = "Я беру Соломію за руку. Її долоня тепла, і це дає мені силу. Разом ми впевнено крокуємо в темний зів тунелю.";
                } else if (this.state.sceneId === 'entrance_courage') {
                    dialogueText = "«Хто останній — той боягуз!» — кричу я, сміючись, і забігаю вперед. Але самотнє відлуння кроків швидко протвережує мене.";
                } else if (this.state.sceneId === 'separation_scene') {
                    dialogueText = "«Соломіє! Соломі-і-ія!» — мій крик губиться в нескінченних білих коридорах. Де вона? Мені страшно за неї. Треба негайно шукати вихід.";
                } else if (this.state.sceneId === 'use_item_scene') {
                    dialogueText = "Я швидко порпаюся в рюкзаку. Мій надійний світлодіодний ліхтарик тут. Це наш порятунок.";
                }
            } else {
                if (this.state.sceneId === 'intro_3') {
                    dialogueText = "Повітря вологе, пахне крейдою. Макс виглядає схвильованим, але намагається бути сміливим. Що мені робити?";
                } else if (this.state.sceneId === 'entrance_trust') {
                    dialogueText = "Макс ніжно бере мене за руку. Його жест такий доречний зараз... Я відчуваю безпеку, і ми крокуємо під склепіння лабіринту.";
                } else if (this.state.sceneId === 'entrance_courage') {
                    dialogueText = "Макс щось кричить про монстрів і тікає вперед. «Гей, зачекай!» — роздратовано кричу я, але він уже зник у темряві.";
                } else if (this.state.sceneId === 'separation_scene') {
                    dialogueText = "«Максе! Це не смішно! Відгукнися!» — мій голос тремтить. Тиша тунелів тисне на вуха. Я залишилася одна. Потрібно зібратися з думками.";
                } else if (this.state.sceneId === 'use_item_scene') {
                    dialogueText = "Я намацую в кишені шматочок сухої крейди, що взяла на пам'ять на вході, та старовинну монету. Я можу помічати свій шлях на стінах.";
                }
            }
        }

        // Start Typewriter
        this.isTyping = true;
        this.currentTypeText = dialogueText;
        this.typewriterEffect(dialogueText, this.textSpeed, () => {
            this.isTyping = false;
            this.dom.clickPrompt.classList.remove('hidden');
            
            // Render choices if there are any
            if (scene.choices) {
                this.renderChoices(scene.choices);
            }
        });
    },

    typewriterEffect(text, speed, callback) {
        if (this.typingTimer) clearInterval(this.typingTimer);
        this.dom.dialogueText.innerHTML = "";
        let index = 0;

        this.typingTimer = setInterval(() => {
            if (index < text.length) {
                this.dom.dialogueText.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(this.typingTimer);
                if (callback) callback();
            }
        }, speed);
    },

    skipTyping() {
        if (this.typingTimer) clearInterval(this.typingTimer);
        this.dom.dialogueText.innerHTML = this.currentTypeText;
        this.isTyping = false;
        this.dom.clickPrompt.classList.remove('hidden');
        
        const scene = STORY_SCRIPT[this.state.sceneId];
        if (scene && scene.choices) {
            this.renderChoices(scene.choices);
        }
    },

    onDialogueBoxClick() {
        if (this.isTyping) {
            this.skipTyping();
            return;
        }

        const scene = STORY_SCRIPT[this.state.sceneId];
        if (!scene) return;

        // If scene has choices, force user to select one instead of clicking box
        if (scene.choices) return;

        // Progress to next scene
        if (scene.next) {
            // Special reset case
            if (scene.next === 'main_menu_reset') {
                this.resetToMainMenu();
            } else {
                this.state.sceneId = scene.next;
                this.renderScene();
            }
        }
    },

    updatePortraits(speakerName, bg) {
        this.dom.portraitLeft.classList.add('hidden');
        this.dom.portraitRight.classList.add('hidden');
        this.dom.portraitLeft.className = "char-portrait hidden";
        this.dom.portraitRight.className = "char-portrait hidden";
        
        const isGhostScene = bg === "assets/ghost_bieluch.png";
        const isKissScene = bg === "assets/couple_kiss.png";

        if (isGhostScene) {
            // Show Ghost Bieluch in the center/right
            this.dom.portraitRight.style.backgroundImage = `url('assets/ghost_bieluch.png')`;
            this.dom.portraitRight.className = "char-portrait active ghost-float";
            this.dom.portraitRight.classList.remove('hidden');
            
            if (speakerName === "Привид Білух") {
                this.dom.portraitRight.classList.add('speaking');
            } else {
                this.dom.portraitRight.classList.add('inactive');
            }
        }
    },

    renderChoices(choices) {
        this.dom.choicesContainer.innerHTML = "";
        this.dom.choicesContainer.classList.remove('hidden');
        this.dom.clickPrompt.classList.add('hidden'); // Hide click indicator during choices

        choices.forEach((choice, index) => {
            // Check choice condition if any
            if (choice.condition && !choice.condition(this.state)) {
                return; // Hide choices that don't meet condition
            }

            const button = document.createElement('button');
            button.className = "choice-btn";
            button.id = `choice-${index + 1}`;
            button.innerText = choice.text;
            
            // Animation staggered delay
            button.style.animationDelay = `${index * 0.15}s`;

            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering dialogue box click
                this.audio.playChime();
                
                const prevSceneId = this.state.sceneId;
                
                if (choice.action) {
                    choice.action(this.state);
                }

                // Only apply choice.next if the action didn't already change sceneId
                if (this.state.sceneId === prevSceneId) {
                    this.state.sceneId = choice.next;
                }
                this.renderScene();
            });

            this.dom.choicesContainer.appendChild(button);
        });
    },

    updateInventoryUI() {
        this.dom.inventoryItems.innerHTML = "";
        if (this.state.inventory.length === 0) {
            this.dom.inventoryItems.innerHTML = `<span class="empty-inventory">Порожньо</span>`;
        } else {
            this.state.inventory.forEach(item => {
                const badge = document.createElement('span');
                badge.className = "inventory-item";
                badge.innerText = item;
                this.dom.inventoryItems.appendChild(badge);
            });
        }
    },

    handleAudioEvent(event) {
        if (event === "spooky_swell") {
            this.audio.playSpookySwell();
        } else if (event === "heartbeat_start") {
            this.audio.startHeartbeat();
        } else if (event === "heartbeat_stop") {
            this.audio.stopHeartbeat();
        }
    },

    toggleSound() {
        if (this.audio.isMuted) {
            this.audio.unmute();
            this.dom.btnToggleSound.innerText = "🔉⤓";
            this.dom.btnToggleSound.className = "control-btn sound-on";
            this.dom.btnToggleSound.title = "Вимкнути звук";
            this.dom.audioIndicator.classList.remove('muted');
        } else {
            this.audio.mute();
            this.dom.btnToggleSound.innerText = "🔇⤒";
            this.dom.btnToggleSound.className = "control-btn sound-off";
            this.dom.btnToggleSound.title = "Увімкнути звук";
            this.dom.audioIndicator.classList.add('muted');
        }
    },

    resetToMainMenu() {
        this.audio.stopHeartbeat();
        this.state = {
            character: null,
            sceneId: 'intro_1',
            inventory: [],
            choicesMade: [],
            trustPoints: 0,
            riddleAttempts: 0
        };
        
        this.dom.charMax.classList.remove('selected');
        this.dom.charJulia.classList.remove('selected');
        this.dom.btnCharConfirm.classList.add('disabled');
        this.dom.btnCharConfirm.setAttribute('disabled', 'true');
        
        localStorage.removeItem('game_love_autosave');
        if (this.dom.btnContinueGame) {
            this.dom.btnContinueGame.classList.add('hidden');
            this.dom.btnStartGame.classList.remove('secondary-btn');
            this.dom.btnStartGame.classList.add('primary-btn');
        }

        this.showScreen(this.dom.mainMenu);
        this.dom.bgViewport.style.backgroundImage = "none";
    },

    saveSettings() {
        const settings = {
            textSpeed: this.textSpeed,
            ambientVolume: this.audio.volume * 100,
            isMuted: this.audio.isMuted
        };
        localStorage.setItem('game_love_settings', JSON.stringify(settings));
    },

    loadSettings() {
        const data = localStorage.getItem('game_love_settings');
        if (data) {
            try {
                const settings = JSON.parse(data);
                if (settings.textSpeed !== undefined) {
                    this.textSpeed = settings.textSpeed;
                    const val = 90 - this.textSpeed;
                    if (this.dom.sliderTextSpeed) {
                        this.dom.sliderTextSpeed.value = val;
                    }
                    if (this.dom.valTextSpeed) {
                        this.dom.valTextSpeed.innerText = val > 60 ? "Швидко" : val < 30 ? "Повільно" : "Нормально";
                    }
                }
                if (settings.ambientVolume !== undefined) {
                    if (this.dom.sliderAmbientVolume) {
                        this.dom.sliderAmbientVolume.value = settings.ambientVolume;
                    }
                    if (this.dom.valAmbientVolume) {
                        this.dom.valAmbientVolume.innerText = settings.ambientVolume + "%";
                    }
                    this.audio.volume = settings.ambientVolume / 100;
                }
                if (settings.isMuted !== undefined) {
                    this.audio.isMuted = settings.isMuted;
                    if (this.dom.btnToggleSound) {
                        if (this.audio.isMuted) {
                            this.dom.btnToggleSound.innerText = "🔇⤒";
                            this.dom.btnToggleSound.className = "control-btn sound-off";
                            this.dom.audioIndicator.classList.add('muted');
                        } else {
                            this.dom.btnToggleSound.innerText = "🔉⤓";
                            this.dom.btnToggleSound.className = "control-btn sound-on";
                            this.dom.audioIndicator.classList.remove('muted');
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading settings:", e);
            }
        }
    },

    checkAutoSave() {
        const autoSaveData = localStorage.getItem('game_love_autosave');
        if (autoSaveData) {
            try {
                const parsed = JSON.parse(autoSaveData);
                if (parsed && parsed.character && parsed.sceneId && parsed.sceneId !== 'intro_1') {
                    if (this.dom.btnContinueGame) {
                        this.dom.btnContinueGame.classList.remove('hidden');
                    }
                    if (this.dom.btnStartGame) {
                        this.dom.btnStartGame.classList.remove('primary-btn');
                        this.dom.btnStartGame.classList.add('secondary-btn');
                    }
                }
            } catch (e) {
                console.error("Error parsing autosave:", e);
            }
        }
    },

    loadGallery() {
        const endings = ['true_love', 'normal', 'friendship', 'lost'];
        endings.forEach(ending => {
            const isUnlocked = localStorage.getItem(`game_love_ending_${ending}`) === 'true';
            const cardEl = document.getElementById(`gallery-ending-${ending}`);
            if (cardEl) {
                if (isUnlocked) {
                    cardEl.classList.remove('locked');
                    cardEl.classList.add('unlocked');
                } else {
                    cardEl.classList.remove('unlocked');
                    cardEl.classList.add('locked');
                }
            }
        });
    },

    // Save and Load logic (Auto-Save, Manual Slots)
    autoSave() {
        const data = JSON.stringify(this.state);
        localStorage.setItem('game_love_autosave', data);
    },

    quickSave() {
        const data = JSON.stringify(this.state);
        localStorage.setItem('game_love_quicksave', data);
        this.showSaveToast("Швидке збереження...");
    },

    quickLoad() {
        const data = localStorage.getItem('game_love_quicksave');
        if (data) {
            this.state = JSON.parse(data);
            this.showScreen(this.dom.storyViewport);
            this.renderScene();
            this.showSaveToast("Швидке завантаження!");
        } else {
            alert("Не знайдено швидкого збереження.");
        }
    },

    showSaveToast(text) {
        // Temporary UI visualizer
        this.audio.playChime();
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '20px';
        notification.style.background = 'var(--primary)';
        notification.style.color = '#fff';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.fontFamily = 'var(--font-ui)';
        notification.style.fontSize = '0.85rem';
        notification.style.fontWeight = 'bold';
        notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.5s ease';
        notification.innerText = text;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 1500);
    },

    openSaveLoadModal(isSaveMode = true) {
        this.dom.saveloadTitle.innerText = isSaveMode ? "Зберегти прогрес" : "Завантажити гру";
        
        // Hide/Show Save button inside slots depending on mode
        document.querySelectorAll('.save-slot').forEach(slotEl => {
            const saveBtn = slotEl.querySelector('.action-save');
            const loadBtn = slotEl.querySelector('.action-load');
            
            if (isSaveMode) {
                saveBtn.style.display = 'block';
            } else {
                saveBtn.style.display = 'none';
            }
        });

        this.loadSaveSlotsInfo();
        this.dom.saveloadModal.classList.remove('hidden');
    },

    loadSaveSlotsInfo() {
        for (let i = 1; i <= 3; i++) {
            const slotData = localStorage.getItem(`game_love_slot_${i}`);
            const slotEl = document.querySelector(`.save-slot[data-slot="${i}"]`);
            const statusEl = slotEl.querySelector('.slot-status');
            const loadBtn = slotEl.querySelector('.action-load');
            
            if (slotData) {
                const parsed = JSON.parse(slotData);
                const charName = parsed.character === 'max' ? "Макс" : "Соломія";
                statusEl.innerHTML = `<span class="slot-meta">Персонаж: ${charName}</span><br>Сцена: ${this.getSceneTitle(parsed.sceneId)}`;
                loadBtn.removeAttribute('disabled');
            } else {
                statusEl.innerText = "Порожньо";
                loadBtn.setAttribute('disabled', 'true');
            }
        }
    },

    getSceneTitle(sceneId) {
        const titles = {
            intro_1: "Вхід до лабіринту (1)",
            intro_2: "Вхід до лабіринту (2)",
            intro_3: "Перший вибір",
            entrance_trust: "Довіра на старті",
            entrance_courage: "Сміливий жарт",
            labyrinth_split: "Роздоріжжя",
            path_left: "Небезпечний поворот",
            path_right: "Блискуча знахідка",
            separation_event: "Холодний туман",
            separation_scene: "Розділені темрявою",
            lost_darkness: "Блукання наосліп",
            use_item_scene: "Вибір речей",
            ghost_encounter: "Світло привіда",
            ghost_talk_1: "Зустріч з Білухом",
            ghost_angry: "Гнів духа",
            ghost_riddle_intro: "Загадка Білуха (1)",
            ghost_riddle: "Загадка Білуха (2)",
            ghost_riddle_fail: "Хибна відповідь",
            ghost_second_chance: "Другий шанс",
            ghost_give_coin: "Дар історії",
            ghost_riddle_success: "Вірна відповідь",
            ghost_gift: "Благословення",
            reunion_path: "Шлях до возз'єднання",
            reunion_kiss: "Зустріч закоханих",
            final_ending_calculation: "Доля закоханих"
        };
        return titles[sceneId] || "Невідома сцена";
    },

    saveToSlot(slotNum) {
        const data = JSON.stringify(this.state);
        localStorage.setItem(`game_love_slot_${slotNum}`, data);
        this.loadSaveSlotsInfo();
        this.showSaveToast(`Збережено в Слот ${slotNum}!`);
    },

    loadFromSlot(slotNum) {
        const data = localStorage.getItem(`game_love_slot_${slotNum}`);
        if (data) {
            this.state = JSON.parse(data);
            this.dom.saveloadModal.classList.add('hidden');
            this.showScreen(this.dom.storyViewport);
            this.renderScene();
            this.showSaveToast(`Завантажено Слот ${slotNum}!`);
        }
    }
};

// Initialize the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
