class QuizApp {
    constructor() {
        this.quizEngine = new QuizEngine();
        this.selectedQuizFile = null;
        this.init();
    }

    init() {
        // Cache DOM elements precisely
        this.btnStart = document.getElementById('startQuiz');
        this.quizListContainer = document.getElementById('quizList');
        
        // Ensure buttons only work if inputs are filled
        const validator = () => {
            const name = document.getElementById('studentName').value.trim();
            const school = document.getElementById('schoolName').value.trim();
            this.btnStart.disabled = !(name && school && this.selectedQuizFile);
        };

        document.getElementById('studentName').addEventListener('input', validator);
        document.getElementById('schoolName').addEventListener('input', validator);

        // START BUTTON HANDLER
        this.btnStart.addEventListener('click', () => this.handleStart());
        
        // MODAL HANDLERS
        document.getElementById('quitBtn').addEventListener('click', () => {
            document.getElementById('quitModal').classList.add('active');
        });
        document.getElementById('cancelQuit').addEventListener('click', () => {
            document.getElementById('quitModal').classList.remove('active');
        });

        this.renderQuizLibrary();
    }

    renderQuizLibrary() {
        // CHAPTER LIST (Matching your JSON folder)
        const chapters = [
            { name: "💻 HTML Challenge", file: "coding-challenge-html.json" },
            { name: "💻 JS Challenge", file: "coding-challenge-js.json" },
            { name: "💻 PHP Challenge", file: "coding-challenge-php.json" },
            { name: "💻 PL/SQL Challenge", file: "coding-challenge-plsql.json" }
        ];

        this.quizListContainer.innerHTML = '';
        chapters.forEach(ch => {
            const div = document.createElement('div');
            div.className = 'quiz-btn-item'; // Style this in CSS
            div.textContent = ch.name;
            div.onclick = () => {
                this.selectedQuizFile = ch.file;
                // Visual feedback for selection
                document.querySelectorAll('.quiz-btn-item').forEach(e => e.classList.remove('selected'));
                div.classList.add('selected');
                document.getElementById('studentName').dispatchEvent(new Event('input')); // Re-validate
            };
            this.quizListContainer.appendChild(div);
        });
    }

    async handleStart() {
        try {
            // METICULOUS PATH CHECK
            const response = await fetch(`jsons/${this.selectedQuizFile}`);
            if (!response.ok) throw new Error("File not found in jsons folder");
            const data = await response.json();
            
            this.quizEngine.loadQuizData(data);
            this.showScreen('quizScreen');
            this.showQuestion(0);
        } catch (e) {
            document.getElementById('errorMessage').textContent = "Error: " + e.message;
        }
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    // ... (Remainder of gameplay logic)
}

window.onload = () => { new QuizApp(); };
