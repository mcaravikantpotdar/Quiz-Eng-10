class QuizApp {
    constructor() {
        this.quizEngine = new QuizEngine();
        
        // --- CONFIGURATION ---
        this.SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxt-akN_S5Dmr3HdtxpEL9by9J80kmZYCufXI1e9_fK3Ep0QYomPU-6jF-3ryPq7Q/exec";
        
        // --- GITHUB API CONFIG (Update these two!) ---
        this.GITHUB_CONFIG = {
            owner: "mcaravikantpotdar", // Your GitHub username
            repo: "Quiz",        // Your repository name
            path: "jsons"                  // The folder where your JSONs live
        };
        
        // State
        this.currentAttempts = {};
        this.hintUsed = {};
        this.shuffledOrders = {}; 
        this.selectedQuizFile = null;
        this.availableQuizzes = []; // Now populated automatically

        this.init();
    }

    async init() {
        this.cacheDOM();
        this.bindEvents();
        
        // Robust Step: Automatically scan GitHub for quiz files
        console.log("Quiz App Initialized - Auto-Scanning GitHub Library...");
        await this.autoScanGitHubLibrary();
    }

    // --- NEW: PROFESSIONAL AUTO-SCAN LOGIC ---
    async autoScanGitHubLibrary() {
        const { owner, repo, path } = this.GITHUB_CONFIG;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        try {
            // Fetch the directory listing from GitHub API
            const response = await fetch(apiUrl, { cache: 'no-cache' });
            if (!response.ok) throw new Error("Failed to scan GitHub directory.");
            
            const files = await response.json();

            // Transform filenames into a clean library
            this.availableQuizzes = files
                .filter(file => file.name.endsWith('.json'))
                .map(file => {
                    // Clean up filenames for the button display:
                    // Removes '.json', replaces '-' with ' ', and capitalizes
                    const cleanName = file.name
                        .replace('.json', '')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                        
                    return {
                        name: `📂 ${cleanName}`,
                        file: file.name
                    };
                });

            this.renderQuizLibrary();
        } catch (error) {
            console.error("Auto-scan failed:", error);
            this.errorDiv.textContent = "Error: Could not scan GitHub directory. Check GITHUB_CONFIG.";
        }
    }

    cacheDOM() {
        this.inputName = document.getElementById('studentName');
        this.inputSchool = document.getElementById('schoolName');
        this.quizListContainer = document.getElementById('quizList');
        this.btnStart = document.getElementById('startQuiz');
        this.btnViewScoreboard = document.getElementById('viewScoreboardBtn');
        this.btnViewScoreboardResults = document.getElementById('viewScoreboardFromResults');
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
        
        if (this.btnDemo) {
            this.btnDemo.addEventListener('click', () => this.runDemoMode());
        }
        
        const showScoreboard = () => { QuizUtils.showScreen('scoreboardScreen'); this.fetchScoreboard(); };
        this.btnViewScoreboard.addEventListener('click', showScoreboard);
        if(this.btnViewScoreboardResults) this.btnViewScoreboardResults.addEventListener('click', showScoreboard);
        
        this.btnBackScoreboard.addEventListener('click', () => {
            if (this.quizEngine.quizData && this.quizEngine.currentQuestionIndex >= 0 && this.quizEngine.score > 0) {
                 QuizUtils.showScreen('resultsScreen');
            } else { QuizUtils.showScreen('uploadScreen'); }
        });

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
        if (this.availableQuizzes.length === 0) {
            this.quizListContainer.innerHTML = '<p style="font-size:12px; opacity:0.6;">No JSON files found in /jsons...</p>';
            return;
        }

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
            // Cache Busting: Ensures live updates from GitHub
            const response = await fetch(`jsons/${this.selectedQuizFile}?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Could not load: ${this.selectedQuizFile}`);
            const data = await response.json();
            
            this.quizEngine.loadQuizData(data);
            this.startQuiz();
        } catch (error) {
            this.errorDiv.textContent = `Error: ${error.message}`;
        } finally { QuizUtils.showLoading(false); }
    }

    // --- PRESERVED METHODS (Logic intact) ---
    startQuiz() {
        const mode = document.querySelector('input[name="quizMode"]:checked').value;
        this.quizEngine.setMode(mode);
        this.quizEngine.clearProgress(); 
        this.currentAttempts = {};
        this.hintUsed = {};
        this.shuffledOrders = {}; 

        const metadata = this.quizEngine.quizData.metadata;
        const titleText = metadata.chapter_title || "Quiz";
        const titleHi = metadata.chapter_title_hindi ? ` / ${metadata.chapter_title_hindi}` : "";
        document.getElementById('chapterTitle').textContent = titleText + titleHi;
        document.getElementById('totalQuestions').textContent = this.quizEngine.getTotalQuestions();
        document.getElementById('maxScore').textContent = this.quizEngine.getMaxScore();

        QuizUtils.showScreen('quizScreen');
        this.renderQuestionGrid();
        this.showQuestion(0);
        this.updateScoreDisplay();
    }

    getShuffledOptions(question) {
        const qId = question.question_id;
        if (this.shuffledOrders[qId]) return this.shuffledOrders[qId];
        const allText = JSON.stringify(question.options).toLowerCase();
        const keywords = ["both", "all of", "none of", "above", "below"];
        const isUnsafe = keywords.some(kw => allText.includes(kw));
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

    // ... (rest of gameplay methods are preserved exactly as provided)
}
