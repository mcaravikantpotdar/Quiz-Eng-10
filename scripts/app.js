/* --- SOUND EFFECTS (Embedded Base64) --- */
// Short "Ding" for correct answer
const SOUND_CORRECT = new Audio("data:audio/wav;base64,UklGRn9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."); 
// (Note: To keep this file clean, I will use a generated beep function instead of a massive Base64 string below)

// --- AUDIO UTILS ---
const AudioEngine = {
    playCorrect: function() {
        this.beep(600, 100, 'sine'); // High pitch beep
        setTimeout(() => this.beep(800, 150, 'sine'), 100);
    },
    playWrong: function() {
        this.beep(150, 300, 'sawtooth'); // Low pitch buzz
    },
    beep: function(freq, duration, type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); }, duration);
        } catch(e) { console.log("Audio not supported"); }
    }
};

class QuizApp {
    constructor() {
        this.quizEngine = new QuizEngine();
        
        // --- CONFIGURATION ---
        this.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxt-akN_S5Dmr3HdtxpEL9by9J80kmZYCufXI1e9_fK3Ep0QYomPU-6jF-3ryPq7Q/exec";
        
        // State
        this.currentAttempts = {};
        this.hintUsed = {};
        this.shuffledOrders = {}; 
        this.selectedQuizFile = null;

        // --- QUIZ LIBRARY (Matches your JSON filenames) ---
        this.availableQuizzes = [
            // NEW CODING CHALLENGES
            { name: "💻 HTML Coding Challenge",  file: "coding-challenge-html.json" },
            { name: "💻 JS Coding Challenge",    file: "coding-challenge-js.json" },
            { name: "💻 PHP Coding Challenge",   file: "coding-challenge-php.json" },
            { name: "💻 PL/SQL Coding Challenge", file: "coding-challenge-plsql.json" },

            // ORIGINAL CHAPTERS
            { name: "11th Ch1: Computer Fundamentals", file: "10+1-Ch-1-(Computer Fundamentals).json" },
            { name: "11th Ch2: Digital Network",       file: "10+1-Ch-2-(Digital Network).json" },
            { name: "11th Ch3: DTP (PageMaker)",       file: "10+1-Ch-3-(DTP-PageMaker).json" },
            { name: "11th Ch4: Photoshop",             file: "10+1-Ch-4-(Photoshop).json" },
            { name: "11th Ch5: HTML Fundamentals",     file: "10+1-Ch-5-(HTML).json" },
            { name: "11th Ch6: JavaScript",            file: "10+1-Ch-6-(JS).json" },
            { name: "11th Ch7: Multimedia Apps",       file: "10+1-Ch-7-(Multimedia Applications).json" },
            { name: "12th Ch1: NOS Essentials",        file: "10+2-CH-1-(NOS).json" },
            { name: "12th Ch2: Network Admin",         file: "10+2-CH-2-(Network Administration).json" },
            { name: "12th Ch3: Corel Draw",            file: "10+2-CH-3-(Corel Draw).json" },
            { name: "12th Ch4: PHP Scripting",         file: "10+2-CH-4-(PHP).json" },
            { name: "12th Ch5: RDBMS & MySQL",         file: "10+2-CH-5-(RDBMS-MySQL).json" },
            { name: "12th Ch6: PL/SQL",                file: "10+2-CH-6-(PL-SQL).json" },
            { name: "12th Ch7: Internet & Business",   file: "10+2-CH-7-(Internet and Business Applications).json" }
        ];

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderQuizLibrary();
        console.log("Quiz App Initialized");
    }

    cacheDOM() {
        this.inputName = document.getElementById('studentName');
        this.inputSchool = document.getElementById('schoolName');
        this.quizListContainer = document.getElementById('quizList');
        
        // Buttons
        this.btnStart = document.getElementById('startQuiz');
        this.btnViewScoreboard = document.getElementById('viewScoreboardBtn');
        this.btnBackScoreboard = document.getElementById('backFromScoreboard');
        this.btnDemo = document.getElementById('demoModeBtn');
        
        this.btnNext = document.getElementById('nextBtn');
        this.btnPrev = document.getElementById('prevBtn');
        this.btnHint = document.getElementById('hintBtn');
        this.btnQuit = document.getElementById('quitBtn');
        this.btnConfirmQuit = document.getElementById('confirmQuit');
        this.btnCancelQuit = document.getElementById('cancelQuit');
        this.btnRetake = document.getElementById('retakeBtn');
        this.btnHome = document.getElementById('homeBtn');
        
        this.modalQuit = document.getElementById('quitModal');
        this.errorDiv = document.getElementById('errorMessage');
    }

    bindEvents() {
        this.inputName.addEventListener('input', () => this.validateStartForm());
        this.inputSchool.addEventListener('input', () => this.validateStartForm());
        this.btnStart.addEventListener('click', () => this.handleStart());
        
        if (this.btnDemo) this.btnDemo.addEventListener('click', () => this.runDemoMode());
        
        this.btnViewScoreboard.addEventListener('click', () => { QuizUtils.showScreen('scoreboardScreen'); this.fetchScoreboard(); });
        this.btnBackScoreboard.addEventListener('click', () => QuizUtils.showScreen('uploadScreen'));

        this.btnNext.addEventListener('click', () => this.nextQuestion());
        this.btnPrev.addEventListener('click', () => this.previousQuestion());
        this.btnHint.addEventListener('click', () => this.showHint());
        this.btnQuit.addEventListener('click', () => this.modalQuit.classList.add('active'));
        this.btnCancelQuit.addEventListener('click', () => this.modalQuit.classList.remove('active'));
        this.btnConfirmQuit.addEventListener('click', () => this.quitQuiz());
        this.btnRetake.addEventListener('click', () => this.retakeQuiz());
        this.btnHome.addEventListener('click', () => window.location.reload());
    }

    renderQuizLibrary() {
        this.quizListContainer.innerHTML = '';
        this.availableQuizzes.forEach((quiz) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-btn';
            btn.textContent = quiz.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.quiz-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedQuizFile = quiz.file;
                this.validateStartForm();
            });
            this.quizListContainer.appendChild(btn);
        });
    }

    validateStartForm() {
        const name = this.inputName.value.trim();
        const school = this.inputSchool.value.trim();
        const hasQuiz = !!this.selectedQuizFile;
        this.btnStart.disabled = !(name && school && hasQuiz);
    }

    async handleStart() {
        if (!this.selectedQuizFile) return;
        QuizUtils.showLoading(true);
        this.errorDiv.textContent = '';
        try {
            // CORRECT PATH: Looks in 'jsons' folder relative to index.html
            const response = await fetch(`jsons/${this.selectedQuizFile}`);
            if (!response.ok) throw new Error(`Could not load chapter.`);
            const data = await response.json();
            
            // Validate JSON
            const validation = QuizUtils.validateQuizJSON(data);
            if (!validation.isValid) throw new Error(`Invalid Data: ${validation.errors.join(', ')}`);
            
            this.quizEngine.loadQuizData(data);
            this.startQuiz();
        } catch (error) {
            console.error(error);
            this.errorDiv.textContent = `Error: ${error.message}`;
        } finally { QuizUtils.showLoading(false); }
    }

    startQuiz() {
        const mode = document.querySelector('input[name="quizMode"]:checked').value;
        this.quizEngine.setMode(mode);
        this.quizEngine.clearProgress(); 
        this.currentAttempts = {};
        this.hintUsed = {};
        this.shuffledOrders = {};

        const metadata = this.quizEngine.quizData.metadata;
        document.getElementById('chapterTitle').textContent = metadata.chapter_title;
        document.getElementById('totalQuestions').textContent = this.quizEngine.getTotalQuestions();
        document.getElementById('maxScore').textContent = this.quizEngine.getMaxScore();

        QuizUtils.showScreen('quizScreen');
        this.renderQuestionGrid();
        this.showQuestion(0);
        this.updateScoreDisplay();
    }

    // --- SMART SHUFFLE ---
    getShuffledOptions(question) {
        const qId = question.question_id;
        if (this.shuffledOrders[qId]) return this.shuffledOrders[qId];

        const allText = JSON.stringify(question.options).toLowerCase();
        // Prevent shuffling if options depend on order (e.g., "All of the above")
        const isUnsafe = ["both", "all of", "none of", "above", "below"].some(kw => allText.includes(kw));

        let order = ['a', 'b', 'c', 'd'];
        if (!isUnsafe) {
            for (let i = order.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [order[i], order[j]] = [order[j], order[i]];
            }
        }
        this.shuffledOrders[qId] = order;
        return order;
    }

    // --- RENDER LOGIC ---
    renderQuestionGrid() {
        const grid = document.getElementById('questionGrid');
        grid.innerHTML = '';
        this.quizEngine.quizData.questions.forEach((question, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'question-number';
            questionEl.dataset.index = index;
            questionEl.dataset.questionId = question.question_id;
            
            const numberEl = document.createElement('div');
            numberEl.className = 'q-number';
            numberEl.textContent = index + 1;
            questionEl.appendChild(numberEl);
            
            questionEl.addEventListener('click', () => this.goToQuestion(index));
            grid.appendChild(questionEl);
        });
    }

    showQuestion(index) {
        if (this.quizEngine.currentQuestionId) {
            this.quizEngine.saveCurrentQuestionTime(this.quizEngine.currentQuestionId, this.quizEngine.currentTimer);
        }
        this.quizEngine.currentQuestionIndex = index;
        const question = this.quizEngine.getCurrentQuestion();
        if (!question) return;
        
        // Render Text (Inner HTML allows <pre> tags for code)
        document.getElementById('questionEn').innerHTML = question.question.en;
        document.getElementById('questionHi').innerHTML = question.question.hi;
        document.getElementById('currentQuestion').textContent = index + 1;
        
        this.renderOptions(question);
        
        // Cleanup old feedback
        const existingHint = document.getElementById('hintArea');
        if (existingHint) existingHint.remove();
        const existingFeedback = document.getElementById('feedbackContainer');
        if (existingFeedback) existingFeedback.remove();

        // Inject Feedback DOM
        document.getElementById('optionsContainer').insertAdjacentHTML('afterend', `
            <div id="feedbackContainer" class="feedback-area explanation-area" style="display: none;">
                <h4>✅ Explanation</h4>
                <div class="e-en">${question.explanation.en}</div>
                <div class="e-hi">${question.explanation.hi}</div>
            </div>
            <div id="hintArea" class="feedback-area hint-area" style="display: none;">
                <h4>💡 Hint</h4>
                <div class="h-en">${question.hint.en}</div>
                <div class="h-hi">${question.hint.hi}</div>
            </div>
        `);

        if (!this.currentAttempts[question.question_id]) {
            this.currentAttempts[question.question_id] = 0;
        }
        
        this.updateNavigationButtons();
        this.updateQuestionGrid();
        this.startQuestionTimer(question.question_id);
        this.updateHintButton();
        this.updateScoreDisplay();

        // Show existing state
        const isDisabled = this.quizEngine.isQuestionDisabled(question.question_id);
        if (isDisabled && this.quizEngine.mode === 'practice') this.showFeedbackArea('feedbackContainer');
        if (this.hintUsed[question.question_id]) this.showFeedbackArea('hintArea');
    }

    renderOptions(question) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
        
        const displayOrder = this.getShuffledOptions(question);
        const labels = ['A', 'B', 'C', 'D'];
        
        const isDisabled = this.quizEngine.isQuestionDisabled(question.question_id);
        const userAnswer = this.quizEngine.userAnswers[question.question_id];
        
        displayOrder.forEach((optionKey, index) => {
            const option = question.options[optionKey];
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `
                <div class="option-label">${labels[index]}</div>
                <div class="option-content">
                    <div class="option-en">${option.en}</div>
                    <div class="option-hi">${option.hi}</div>
                </div>
            `;
            
            // Visual States
            if (userAnswer) {
                if (optionKey === question.correct_option) card.classList.add('correct');
                else if (optionKey === userAnswer.selectedOption) card.classList.add('wrong');
            } else if (isDisabled && optionKey === question.correct_option) {
                card.classList.add('correct');
            }
            
            if (isDisabled) {
                card.style.cursor = 'default';
            } else {
                card.addEventListener('click', () => this.selectOption(optionKey));
            }
            container.appendChild(card);
        });
    }

    selectOption(selectedOption) {
        const question = this.quizEngine.getCurrentQuestion();
        const qId = question.question_id;
        
        this.currentAttempts[qId] = (this.currentAttempts[qId] || 0) + 1;
        const attemptNum = this.currentAttempts[qId];
        const hintUsed = this.hintUsed[qId] || false;
        
        const result = this.quizEngine.recordAnswer(qId, selectedOption, attemptNum, hintUsed);
        
        // --- PLAY SOUND ---
        if (result.isCorrect) AudioEngine.playCorrect();
        else AudioEngine.playWrong();
        
        this.renderOptions(question);
        this.updateScoreDisplay();
        this.updateQuestionInGrid(qId);
        
        if (this.quizEngine.mode === 'practice' && (result.isCorrect || attemptNum >= 3)) {
            this.showFeedbackArea('feedbackContainer');
            this.quizEngine.clearTimer();
            this.updateNavigationButtons();
        } else if (this.quizEngine.mode === 'test') {
            this.quizEngine.clearTimer();
            this.updateNavigationButtons();
            // In Test mode, auto-advance after short delay
            setTimeout(() => this.nextQuestion(), 800);
        }
    }

    // --- TIMERS & HELPERS ---
    startQuestionTimer(qId) {
        this.quizEngine.startTimer(qId, (t) => {
            document.getElementById('timer').textContent = t;
        }, () => {
            // Time up logic
            this.currentAttempts[qId] = 3; 
            this.quizEngine.recordTimeout(qId, this.hintUsed[qId] || false);
            this.renderOptions(this.quizEngine.getCurrentQuestion());
            this.updateQuestionInGrid(qId);
            this.updateNavigationButtons();
        });
    }

    updateQuestionInGrid(qId) {
        const el = document.querySelector(`.question-number[data-question-id="${qId}"]`);
        if (!el) return;
        el.className = 'question-number ' + this.quizEngine.getQuestionStatus(qId);
        if (this.quizEngine.getCurrentQuestion().question_id === qId) el.classList.add('current');
    }

    updateQuestionGrid() {
        this.quizEngine.quizData.questions.forEach(q => this.updateQuestionInGrid(q.question_id));
    }

    showFeedbackArea(id) {
        const el = document.getElementById(id);
        if(el) { el.style.display = 'block'; el.scrollIntoView({behavior:'smooth', block:'nearest'}); }
    }

    showHint() {
        const q = this.quizEngine.getCurrentQuestion();
        if (!this.hintUsed[q.question_id]) {
            this.hintUsed[q.question_id] = true;
            this.updateHintButton();
        }
        this.showFeedbackArea('hintArea');
    }

    updateHintButton() {
        const q = this.quizEngine.getCurrentQuestion();
        const btn = document.getElementById('hintBtn');
        const used = this.hintUsed[q.question_id];
        const disabled = this.quizEngine.isQuestionDisabled(q.question_id);
        
        btn.disabled = disabled || used;
        btn.textContent = used ? '💡 Hint Used' : '💡 Hint';
    }

    updateScoreDisplay() { document.getElementById('currentScore').textContent = this.quizEngine.score; }

    updateNavigationButtons() {
        const next = document.getElementById('nextBtn');
        const prev = document.getElementById('prevBtn');
        const isLast = this.quizEngine.currentQuestionIndex === this.quizEngine.getTotalQuestions() - 1;
        
        prev.disabled = this.quizEngine.currentQuestionIndex === 0;
        next.textContent = isLast ? 'Finish' : 'Next';
        
        // In Practice mode, lock Next until answered
        if (this.quizEngine.mode === 'practice') {
            const q = this.quizEngine.getCurrentQuestion();
            next.disabled = !this.quizEngine.isQuestionDisabled(q.question_id);
        } else {
            next.disabled = false;
        }
    }

    nextQuestion() {
        if (this.quizEngine.currentQuestionIndex === this.quizEngine.getTotalQuestions() - 1) {
            this.completeQuiz();
        } else {
            this.quizEngine.clearTimer();
            this.showQuestion(this.quizEngine.currentQuestionIndex + 1);
        }
    }
    previousQuestion() { this.quizEngine.clearTimer(); this.showQuestion(this.quizEngine.currentQuestionIndex - 1); }
    goToQuestion(i) { this.quizEngine.clearTimer(); this.showQuestion(i); }
    quitQuiz() { this.quizEngine.clearTimer(); this.modalQuit.classList.remove('active'); this.completeQuiz(); }
    retakeQuiz() { this.quizEngine.clearProgress(); this.startQuiz(); }

    completeQuiz() {
        this.quizEngine.clearTimer();
        QuizUtils.createConfetti();
        const res = this.quizEngine.getResults();
        
        document.getElementById('finalScore').textContent = res.totalScore;
        document.getElementById('totalPossible').textContent = res.maxScore;
        document.getElementById('percentage').textContent = res.percentage;
        document.getElementById('totalTime').textContent = res.timeTaken;
        
        const container = document.getElementById('resultsBreakdown');
        container.innerHTML = '';
        res.questions.forEach((q, i) => {
            const ans = res.userAnswers[q.question_id];
            const div = document.createElement('div');
            div.className = `result-item ${ans?.isCorrect ? 'correct' : 'wrong'}`;
            div.innerHTML = `<div><strong>Q${i+1}</strong>: ${q.question.en}</div>`;
            container.appendChild(div);
        });
        
        QuizUtils.showScreen('resultsScreen');
        this.submitScore(res);
    }

    async submitScore(res) {
        try {
            await fetch(this.SCRIPT_URL, {
                method: "POST", mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: 'submit',
                    timestamp: new Date().toISOString(),
                    studentName: this.inputName.value,
                    schoolName: this.inputSchool.value,
                    quizTitle: this.quizEngine.quizData.metadata.chapter_title,
                    score: `${res.totalScore}/${res.maxScore}`
                })
            });
        } catch (e) { console.error("Score submit failed", e); }
    }
    
    // --- DEMO MODE ---
    runDemoMode() {
        this.inputName.value = "Demo User";
        this.inputSchool.value = "Test Lab";
        // Loads a tiny fake quiz to test audio/UI
        this.quizEngine.loadQuizData({
            metadata: { chapter_title: "Audio & UI Check", total_questions: 1 },
            questions: [{
                question_id: "d1",
                question: { en: "Test Sound: Click A for Ding, B for Buzz.", hi: "साउंड टेस्ट।" },
                options: { a: {en:"Correct",hi:"सही"}, b: {en:"Wrong",hi:"गलत"}, c:{en:"-",hi:"-"}, d:{en:"-",hi:"-"} },
                correct_option: "a",
                hint: {en:"A is correct.", hi:"A सही है।"},
                explanation: {en:"Did you hear it?", hi:"क्या आपने सुना?"}
            }]
        });
        this.startQuiz();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new QuizApp(); });
