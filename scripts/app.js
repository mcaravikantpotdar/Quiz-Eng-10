class QuizApp {
    constructor() {
        this.quizEngine = new QuizEngine();
        this.selectedQuizFile = null;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderQuizLibrary();
    }

    cacheDOM() {
        this.btnStart = document.getElementById('startQuiz');
        this.inputName = document.getElementById('studentName');
        this.inputSchool = document.getElementById('schoolName');
        this.quizListContainer = document.getElementById('quizList');
        this.errorMsg = document.getElementById('errorMessage');
    }

    bindEvents() {
        // Meticulous Validation: Start button only enables if all info is present
        const validate = () => {
            const hasName = this.inputName.value.trim().length > 0;
            const hasSchool = this.inputSchool.value.trim().length > 0;
            this.btnStart.disabled = !(hasName && hasSchool && this.selectedQuizFile);
        };

        this.inputName.addEventListener('input', validate);
        this.inputSchool.addEventListener('input', validate);

        this.btnStart.addEventListener('click', () => this.handleStart());
        
        // Modal Triggers
        document.getElementById('quitBtn').addEventListener('click', () => {
            document.getElementById('quitModal').classList.add('active');
        });
        document.getElementById('cancelQuit').addEventListener('click', () => {
            document.getElementById('quitModal').classList.remove('active');
        });
        document.getElementById('confirmQuit').addEventListener('click', () => {
            window.location.reload();
        });
    }

    renderQuizLibrary() {
        const chapters = [
            { name: "💻 HTML Coding Challenge", file: "coding-challenge-html.json" },
            { name: "💻 JS Coding Challenge", file: "coding-challenge-js.json" },
            { name: "💻 PHP Coding Challenge", file: "coding-challenge-php.json" },
            { name: "💻 PL/SQL Coding Challenge", file: "coding-challenge-plsql.json" },
            { name: "11th Ch1: Fundamentals", file: "10+1-Ch-1-(Computer Fundamentals).json" }
            // ... add others similarly
        ];

        this.quizListContainer.innerHTML = '';
        chapters.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'quiz-btn-item';
            item.textContent = ch.name;
            item.onclick = () => {
                this.selectedQuizFile = ch.file;
                document.querySelectorAll('.quiz-btn-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                this.inputName.dispatchEvent(new Event('input')); // Re-check button status
            };
            this.quizListContainer.appendChild(item);
        });
    }

    async handleStart() {
        this.errorMsg.textContent = "";
        try {
            // Meticulous Path Check: Folders matter
            const response = await fetch(`jsons/${this.selectedQuizFile}`);
            if (!response.ok) throw new Error("Could not find lesson file in the jsons folder.");
            
            const data = await response.json();
            this.quizEngine.loadQuizData(data);
            
            // Switch Screen
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('quizScreen').classList.add('active');
            
            // Logic for first question
            this.showQuestion(0);
        } catch (err) {
            this.errorMsg.textContent = "Error: " + err.message;
        }
    }
    
    // ... remaining showQuestion and navigation logic goes here
}

window.onload = () => { window.app = new QuizApp(); };
