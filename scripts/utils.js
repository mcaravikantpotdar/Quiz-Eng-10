class QuizUtils {
    static showLoading(show = true) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.toggle('active', show);
    }

    static showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    static createConfetti() {
        const colors = ['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#059669'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static formatTimeSpent(seconds) {
        if (seconds < 60) {
            return `${seconds} seconds`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    static validateQuizJSON(data) {
        const errors = [];
        
        if (!data.metadata) errors.push('Missing metadata');
        if (!data.questions || !Array.isArray(data.questions)) {
            errors.push('Missing or invalid questions array');
        }

        if (data.questions) {
            data.questions.forEach((q, index) => {
                // 1. Basic Structure Checks
                if (!q.question_id) errors.push(`Question ${index + 1}: Missing question_id`);
                if (!q.question || !q.question.en || !q.question.hi) {
                    errors.push(`Question ${index + 1}: Missing question text (en/hi)`);
                }
                if (!q.options || !q.options.a || !q.options.b || !q.options.c || !q.options.d) {
                    errors.push(`Question ${index + 1}: Missing options (a,b,c,d)`);
                }
                if (!q.correct_option || !['a','b','c','d'].includes(q.correct_option)) {
                    errors.push(`Question ${index + 1}: Missing or invalid correct_option`);
                }

                // 2. Pedagogical Field Checks
                if (!q.hint || !q.hint.en || !q.hint.hi) {
                    errors.push(`Question ${index + 1}: Missing hint object (en/hi)`);
                }
                if (!q.explanation || !q.explanation.en || !q.explanation.hi) {
                    errors.push(`Question ${index + 1}: Missing explanation object (en/hi)`);
                }
                if (!q.key_takeaway || !q.key_takeaway.en || !q.key_takeaway.hi) {
                    errors.push(`Question ${index + 1}: Missing key_takeaway object (en/hi)`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static getSampleJSON() {
        return {
            "metadata": {
                "chapter_number": 1,
                "chapter_title": "Sample Chapter",
                "chapter_title_hindi": "नमूना अध्याय",
                "subject": "Sample Subject",
                "total_questions": 1,
                "source_language": "en",
                "target_language": "hi",
                "created_at": new Date().toISOString(),
                "version": "1.0"
            },
            "questions": [
                {
                    "question_id": 1,
                    "question": {
                        "en": "What is the result of 2 + 2?",
                        "hi": "2 + 2 का परिणाम क्या है?"
                    },
                    "options": {
                        "a": {"en": "3", "hi": "3"},
                        "b": {"en": "4", "hi": "4"},
                        "c": {"en": "5", "hi": "5"},
                        "d": {"en": "6", "hi": "6"}
                    },
                    "correct_option": "b",
                    "hint": {
                        "en": "Think about basic arithmetic.",
                        "hi": "बुनियादी अंकगणित के बारे में सोचें।"
                    },
                    "explanation": {
                        "en": "The sum of 2 and 2 is 4.",
                        "hi": "2 और 2 का योग 4 है।"
                    },
                    "key_takeaway": {
                        "en": "Addition combines two numbers.",
                        "hi": "जोड़ दो संख्याओं को मिलाता है।"
                    }
                }
            ]
        };
    }
}