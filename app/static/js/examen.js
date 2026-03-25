/* ============================================
   EXAMEN - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE EXAMEN =====
const Examen = {
    // Configuración específica
    config: {
        defaultQuestions: 20,
        maxQuestions: 50,
        minQuestions: 5,
        timeLimits: [0, 10, 20, 30, 45, 60], // minutos, 0 = sin límite
        passingScore: 70, // porcentaje para aprobar
        showAnswers: true,
        autoSubmit: true,
        soundEnabled: true,
        shuffleOptions: true
    },

    // Estado del examen
    state: {
        isActive: false,
        isPaused: false,
        isCompleted: false,
        questions: [],
        currentQuestion: null,
        currentIndex: 0,
        userAnswers: [],
        flaggedQuestions: new Set(),
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        timeRemaining: 0,
        timer: null,
        startTime: null,
        endTime: null,
        config: {
            totalQuestions: 20,
            difficulty: 'all',
            category: 'all',
            timeLimit: 20,
            randomOrder: true,
            showFeedback: true
        },
        results: null,
        isLoading: false
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Examen iniciado');

        // Cargar categorías
        this.loadCategories();

        // Inicializar componentes
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.loadSavedConfig();

        // Actualizar UI
        this.updateConfigUI();
    },

    // ===== CARGA DE DATOS =====
    loadCategories: function() {
        App.apiRequest('/categories/all', 'GET')
            .then(data => {
                this.populateCategoryFilter(data);
            })
            .catch(error => {
                console.error('Error cargando categorías:', error);
            });
    },

    populateCategoryFilter: function(categories) {
        const select = document.getElementById('exam-category');
        if (!select) return;

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            select.appendChild(option);
        });
    },

    // ===== CONFIGURACIÓN =====
    loadSavedConfig: function() {
        const saved = localStorage.getItem('exam_config');
        if (saved) {
            this.state.config = { ...this.state.config, ...JSON.parse(saved) };
            this.updateConfigUI();
        }
    },

    saveConfig: function() {
        localStorage.setItem('exam_config', JSON.stringify(this.state.config));
    },

    updateConfigUI: function() {
        document.getElementById('exam-questions').value = this.state.config.totalQuestions;
        document.getElementById('exam-difficulty').value = this.state.config.difficulty;
        document.getElementById('exam-category').value = this.state.config.category;
        document.getElementById('exam-time-limit').value = this.state.config.timeLimit;
        document.getElementById('exam-random-order').checked = this.state.config.randomOrder;
        document.getElementById('exam-show-feedback').checked = this.state.config.showFeedback;
    },

    updateConfig: function() {
        this.state.config = {
            totalQuestions: parseInt(document.getElementById('exam-questions').value),
            difficulty: document.getElementById('exam-difficulty').value,
            category: document.getElementById('exam-category').value,
            timeLimit: parseInt(document.getElementById('exam-time-limit').value),
            randomOrder: document.getElementById('exam-random-order').checked,
            showFeedback: document.getElementById('exam-show-feedback').checked
        };

        this.saveConfig();
        this.validateConfig();
    },

    validateConfig: function() {
        const startBtn = document.getElementById('start-exam-btn');
        if (!startBtn) return;

        const isValid = this.state.config.totalQuestions >= this.config.minQuestions &&
                       this.state.config.totalQuestions <= this.config.maxQuestions;

        startBtn.disabled = !isValid;

        if (!isValid) {
            App.showNotification(`Las preguntas deben estar entre ${this.config.minQuestions} y ${this.config.maxQuestions}`, 'warning');
        }
    },

    // ===== INICIO DEL EXAMEN =====
    startExam: function() {
        this.updateConfig();
        this.setState('isLoading', true);

        // Cargar preguntas
        App.apiRequest('/exam/questions', 'POST', {
            total: this.state.config.totalQuestions,
            difficulty: this.state.config.difficulty,
            category: this.state.config.category,
            random: this.state.config.randomOrder
        })
        .then(data => {
            this.state.questions = data.questions;
            this.state.userAnswers = new Array(this.state.questions.length).fill(null);
            this.state.flaggedQuestions.clear();
            
            this.state.isActive = true;
            this.state.startTime = new Date();

            // Configurar temporizador
            if (this.state.config.timeLimit > 0) {
                this.state.timeRemaining = this.state.config.timeLimit * 60;
                this.startTimer();
            }

            // Mostrar área de examen
            document.getElementById('exam-config-section').style.display = 'none';
            document.getElementById('exam-active-section').style.display = 'block';

            // Mostrar primera pregunta
            this.displayQuestion(0);

            // Actualizar UI
            this.updateProgress();
            this.updateQuestionCounters();
            this.updateThumbnails();

            this.setState('isLoading', false);
            App.showNotification('Examen iniciado. ¡Buena suerte!', 'success');

            // Iniciar métricas
            this.startMetrics();
        })
        .catch(error => {
            console.error('Error iniciando examen:', error);
            App.showNotification('Error al iniciar el examen', 'error');
            this.setState('isLoading', false);
        });
    },

    // ===== MANEJO DE PREGUNTAS =====
    displayQuestion: function(index) {
        if (index < 0 || index >= this.state.questions.length) return;

        this.state.currentIndex = index;
        this.state.currentQuestion = this.state.questions[index];

        // Actualizar UI
        document.getElementById('current-question').textContent = index + 1;
        document.getElementById('total-questions').textContent = this.state.questions.length;
        document.getElementById('question-text').textContent = this.state.currentQuestion.text;
        document.getElementById('question-type').textContent = this.getQuestionTypeName(this.state.currentQuestion.type);
        document.getElementById('question-difficulty').textContent = this.state.currentQuestion.difficulty;

        // Mostrar opciones según tipo
        if (this.state.currentQuestion.type === 'order') {
            this.displayOrderOptions();
        } else if (this.state.currentQuestion.type === 'multiple') {
            this.displayMultipleChoiceOptions();
        } else {
            this.displayTextOptions();
        }

        // Cargar respuesta guardada
        this.loadSavedAnswer();

        // Actualizar navegación
        this.updateNavigationButtons();
        this.updateFlagButton();
        this.updateThumbnails();

        // Registrar visualización
        this.trackQuestionView(index);
    },

    displayOrderOptions: function() {
        const container = document.getElementById('options-container');
        const options = this.state.currentQuestion.options;
        const shuffled = this.config.shuffleOptions ? this.shuffleArray([...options]) : options;

        container.innerHTML = `
            <div class="order-options">
                ${shuffled.map((opt, i) => `
                    <div class="order-option" data-index="${i}" onclick="Examen.selectOrderOption(${i})">
                        ${opt}
                    </div>
                `).join('')}
            </div>
        `;
    },

    displayMultipleChoiceOptions: function() {
        const container = document.getElementById('options-container');
        const options = this.state.currentQuestion.options;
        const shuffled = this.config.shuffleOptions ? this.shuffleArray([...options]) : options;

        container.innerHTML = `
            <div class="multiple-choice-options">
                ${shuffled.map((opt, i) => `
                    <div class="choice-option" onclick="Examen.selectChoiceOption(${i})">
                        <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                        <span class="option-text">${opt}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    displayTextOptions: function() {
        document.getElementById('options-container').innerHTML = `
            <textarea id="text-answer" class="form-control" rows="4" 
                placeholder="Escribe tu respuesta aquí..."></textarea>
        `;
    },

    selectOrderOption: function(index) {
        const selected = this.state.userAnswers[this.state.currentIndex] || [];
        
        if (!selected.includes(index)) {
            selected.push(index);
            this.saveAnswer(selected);
            
            // Marcar como seleccionado
            document.querySelectorAll('.order-option').forEach((opt, i) => {
                if (selected.includes(i)) {
                    opt.classList.add('selected');
                }
            });
        }
    },

    selectChoiceOption: function(index) {
        this.saveAnswer(index);
        
        // Marcar como seleccionado
        document.querySelectorAll('.choice-option').forEach((opt, i) => {
            if (i === index) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    },

    saveAnswer: function(answer) {
        this.state.userAnswers[this.state.currentIndex] = answer;
        this.updateProgress();
        this.updateThumbnails();
        
        // Mostrar confirmación
        if (this.state.config.showFeedback) {
            App.showNotification('Respuesta guardada', 'success', 1000);
        }
    },

    loadSavedAnswer: function() {
        const answer = this.state.userAnswers[this.state.currentIndex];
        if (!answer) return;

        if (this.state.currentQuestion.type === 'order' && Array.isArray(answer)) {
            document.querySelectorAll('.order-option').forEach((opt, i) => {
                if (answer.includes(i)) {
                    opt.classList.add('selected');
                }
            });
        } else if (this.state.currentQuestion.type === 'multiple') {
            document.querySelectorAll('.choice-option').forEach((opt, i) => {
                if (i === answer) {
                    opt.classList.add('selected');
                }
            });
        } else if (this.state.currentQuestion.type === 'text') {
            document.getElementById('text-answer').value = answer;
        }
    },

    // ===== NAVEGACIÓN =====
    nextQuestion: function() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.displayQuestion(this.state.currentIndex + 1);
        }
    },

    previousQuestion: function() {
        if (this.state.currentIndex > 0) {
            this.displayQuestion(this.state.currentIndex - 1);
        }
    },

    jumpToQuestion: function(index) {
        this.displayQuestion(index);
    },

    // ===== MARCADORES =====
    toggleFlag: function() {
        if (this.state.flaggedQuestions.has(this.state.currentIndex)) {
            this.state.flaggedQuestions.delete(this.state.currentIndex);
        } else {
            this.state.flaggedQuestions.add(this.state.currentIndex);
        }

        this.updateFlagButton();
        this.updateThumbnails();
    },

    updateFlagButton: function() {
        const btn = document.getElementById('flag-btn');
        const isFlagged = this.state.flaggedQuestions.has(this.state.currentIndex);

        btn.innerHTML = isFlagged ? 
            '<i class="fas fa-flag"></i> Desmarcar' : 
            '<i class="fas fa-flag"></i> Marcar';
        btn.classList.toggle('btn-warning', isFlagged);
        btn.classList.toggle('btn-outline-warning', !isFlagged);
    },

    // ===== TEMPORIZADOR =====
    startTimer: function() {
        this.state.timer = setInterval(() => {
            if (!this.state.isPaused) {
                this.state.timeRemaining--;

                const minutes = Math.floor(this.state.timeRemaining / 60);
                const seconds = this.state.timeRemaining % 60;
                
                document.getElementById('timer-display').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                if (this.state.timeRemaining <= 0) {
                    this.timeOut();
                }

                if (this.state.timeRemaining <= 60) {
                    document.getElementById('timer-display').classList.add('timer-warning');
                }

                // Actualizar cada minuto las métricas
                if (this.state.timeRemaining % 60 === 0) {
                    this.updateMetrics();
                }
            }
        }, 1000);
    },

    pauseTimer: function() {
        this.state.isPaused = true;
    },

    resumeTimer: function() {
        this.state.isPaused = false;
    },

    timeOut: function() {
        clearInterval(this.state.timer);
        App.showNotification('¡Tiempo agotado!', 'warning');
        this.submitExam();
    },

    // ===== PROGRESO =====
    updateProgress: function() {
        const answered = this.state.userAnswers.filter(a => a !== null).length;
        const progress = (answered / this.state.questions.length) * 100;
        
        document.getElementById('progress-bar').style.width = progress + '%';
        document.getElementById('answered-count').textContent = answered;
    },

    updateQuestionCounters: function() {
        document.getElementById('total-questions-display').textContent = this.state.questions.length;
        document.getElementById('answered-count-display').textContent = 
            this.state.userAnswers.filter(a => a !== null).length;
    },

    updateNavigationButtons: function() {
        document.getElementById('prev-btn').disabled = this.state.currentIndex === 0;
        document.getElementById('next-btn').disabled = this.state.currentIndex === this.state.questions.length - 1;
    },

    updateThumbnails: function() {
        const container = document.getElementById('question-thumbnails');
        if (!container) return;

        let html = '';
        this.state.questions.forEach((q, i) => {
            let classes = ['thumbnail'];
            
            if (this.state.userAnswers[i] !== null) classes.push('answered');
            if (this.state.flaggedQuestions.has(i)) classes.push('flagged');
            if (i === this.state.currentIndex) classes.push('current');
            
            html += `
                <div class="${classes.join(' ')}" onclick="Examen.jumpToQuestion(${i})">
                    ${i + 1}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // ===== ENTREGA DEL EXAMEN =====
    submitExam: function() {
        if (!confirm('¿Estás seguro de que quieres entregar el examen?')) return;

        this.state.isActive = false;
        this.state.endTime = new Date();

        if (this.state.timer) {
            clearInterval(this.state.timer);
        }

        this.calculateResults();
        this.showResults();
        this.saveResults();
    },

    calculateResults: function() {
        let correct = 0;
        let incorrect = 0;
        let unanswered = 0;
        const details = [];

        this.state.questions.forEach((question, index) => {
            const answer = this.state.userAnswers[index];
            const isCorrect = this.checkAnswer(question, answer);

            if (answer === null) {
                unanswered++;
            } else if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }

            details.push({
                question: index + 1,
                text: question.text,
                userAnswer: this.formatAnswer(answer),
                correctAnswer: this.formatAnswer(question.correctAnswer),
                isCorrect: isCorrect,
                timeSpent: this.getQuestionTime(index)
            });
        });

        const totalQuestions = this.state.questions.length;
        const score = Math.round((correct / totalQuestions) * 100);

        this.state.results = {
            score: score,
            correct: correct,
            incorrect: incorrect,
            unanswered: unanswered,
            total: totalQuestions,
            passed: score >= this.config.passingScore,
            timeSpent: this.getTotalTime(),
            details: details,
            metrics: this.getMetrics()
        };
    },

    checkAnswer: function(question, answer) {
        if (answer === null) return false;

        switch(question.type) {
            case 'order':
                return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
            case 'multiple':
                return answer === question.correctAnswer;
            case 'text':
                return this.compareTextAnswers(answer, question.correctAnswer);
            default:
                return false;
        }
    },

    compareTextAnswers: function(user, correct) {
        const normalize = (text) => {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };
        return normalize(user) === normalize(correct);
    },

    formatAnswer: function(answer) {
        if (Array.isArray(answer)) {
            return answer.join(' → ');
        }
        return answer || 'Sin respuesta';
    },

    // ===== RESULTADOS =====
    showResults: function() {
        const results = this.state.results;

        document.getElementById('final-score').textContent = results.score + '%';
        document.getElementById('final-grade').textContent = results.passed ? 'APROBADO' : 'REPROBADO';
        document.getElementById('final-grade').className = results.passed ? 'text-success' : 'text-danger';
        
        document.getElementById('correct-count-final').textContent = results.correct;
        document.getElementById('incorrect-count-final').textContent = results.incorrect;
        document.getElementById('unanswered-count-final').textContent = results.unanswered;
        document.getElementById('total-questions-final').textContent = results.total;
        document.getElementById('time-spent-final').textContent = this.formatTime(results.timeSpent);

        // Mostrar tabla de detalles
        this.showResultsTable();

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('results-modal'));
        modal.show();

        // Reproducir sonido
        if (this.config.soundEnabled) {
            this.playSound(results.passed ? 'success' : 'failure');
        }
    },

    showResultsTable: function() {
        const container = document.getElementById('results-table-body');
        if (!container) return;

        container.innerHTML = this.state.results.details.map(d => `
            <tr class="${d.isCorrect ? 'table-success' : 'table-danger'}">
                <td>${d.question}</td>
                <td>${d.userAnswer}</td>
                <td>${d.correctAnswer}</td>
                <td>
                    <i class="fas fa-${d.isCorrect ? 'check text-success' : 'times text-danger'}"></i>
                </td>
                <td>${d.timeSpent}s</td>
            </tr>
        `).join('');
    },

    // ===== MÉTRICAS =====
    startMetrics: function() {
        this.state.metrics = {
            questionTimes: new Array(this.state.questions.length).fill(0),
            lastQuestionStart: Date.now()
        };
    },

    updateMetrics: function() {
        if (this.state.metrics) {
            const timeSpent = Math.floor((Date.now() - this.state.metrics.lastQuestionStart) / 1000);
            this.state.metrics.questionTimes[this.state.currentIndex] += timeSpent;
            this.state.metrics.lastQuestionStart = Date.now();
        }
    },

    getQuestionTime: function(index) {
        return this.state.metrics?.questionTimes[index] || 0;
    },

    getTotalTime: function() {
        return Math.floor((this.state.endTime - this.state.startTime) / 1000);
    },

    getMetrics: function() {
        const avgTimePerQuestion = this.state.metrics.questionTimes.reduce((a, b) => a + b, 0) / 
                                   this.state.questions.length;

        return {
            avgTimePerQuestion: Math.round(avgTimePerQuestion),
            fastestQuestion: Math.min(...this.state.metrics.questionTimes),
            slowestQuestion: Math.max(...this.state.metrics.questionTimes),
            flaggedCount: this.state.flaggedQuestions.size
        };
    },

    // ===== GUARDADO =====
    saveResults: function() {
        const saved = JSON.parse(localStorage.getItem('exam_results') || '[]');
        saved.unshift({
            date: new Date().toISOString(),
            score: this.state.results.score,
            passed: this.state.results.passed,
            totalQuestions: this.state.results.total,
            timeSpent: this.state.results.timeSpent,
            config: this.state.config
        });

        // Mantener solo los últimos 20 resultados
        if (saved.length > 20) saved.pop();

        localStorage.setItem('exam_results', JSON.stringify(saved));
    },

    loadPreviousResults: function() {
        const saved = JSON.parse(localStorage.getItem('exam_results') || '[]');
        this.displayHistory(saved);
    },

    displayHistory: function(results) {
        const container = document.getElementById('exam-history');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay exámenes anteriores</p>';
            return;
        }

        container.innerHTML = results.map(r => `
            <div class="exam-history-item ${r.passed ? 'passed' : 'failed'}">
                <div class="history-date">${new Date(r.date).toLocaleDateString()}</div>
                <div class="history-score">${r.score}%</div>
                <div class="history-details">
                    ${r.totalQuestions} preguntas · ${this.formatTime(r.timeSpent)}
                </div>
            </div>
        `).join('');
    },

    // ===== REVISIÓN =====
    reviewExam: function() {
        // Cerrar modal y volver al examen para revisión
        bootstrap.Modal.getInstance(document.getElementById('results-modal')).hide();
        
        this.state.isActive = true;
        this.state.isCompleted = true;
        
        // Mostrar respuestas correctas
        this.state.questions.forEach((q, i) => {
            // Marcar visualmente las respuestas correctas/incorrectas
        });
    },

    // ===== REINICIO =====
    resetExam: function() {
        this.state = {
            ...this.state,
            isActive: false,
            isCompleted: false,
            questions: [],
            userAnswers: [],
            flaggedQuestions: new Set(),
            timer: null
        };

        document.getElementById('exam-config-section').style.display = 'block';
        document.getElementById('exam-active-section').style.display = 'none';
        document.getElementById('results-modal').style.display = 'none';

        this.loadSavedConfig();
    },

    // ===== UTILIDADES =====
    getQuestionTypeName: function(type) {
        const names = {
            'order': 'Ordenar componentes',
            'multiple': 'Opción múltiple',
            'text': 'Respuesta escrita'
        };
        return names[type] || type;
    },

    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    playSound: function(type) {
        const audio = new Audio(`/static/sounds/${type}.mp3`);
        audio.play().catch(() => {});
    },

    setState: function(key, value) {
        this.state[key] = value;
        this.updateUI();
    },

    updateUI: function() {
        if (this.state.isLoading) {
            App.showLoader();
        } else {
            App.hideLoader();
        }
    },

    // ===== EVENTOS =====
    initEventListeners: function() {
        // Botones de configuración
        document.getElementById('exam-questions')?.addEventListener('input', () => this.validateConfig());
        document.getElementById('start-exam-btn')?.addEventListener('click', () => this.startExam());
        
        // Botones del examen activo
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('flag-btn')?.addEventListener('click', () => this.toggleFlag());
        document.getElementById('submit-exam-btn')?.addEventListener('click', () => this.submitExam());
        document.getElementById('pause-exam-btn')?.addEventListener('click', () => this.pauseTimer());
        
        // Botones de resultados
        document.getElementById('review-exam-btn')?.addEventListener('click', () => this.reviewExam());
        document.getElementById('new-exam-btn')?.addEventListener('click', () => this.resetExam());
        
        // Botones de historial
        document.getElementById('show-history-btn')?.addEventListener('click', () => this.loadPreviousResults());
    },

    initKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            if (!this.state.isActive || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextQuestion();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousQuestion();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.toggleFlag();
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    this.submitExam();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.pauseTimer();
                    break;
            }
        });
    },

    trackQuestionView: function(index) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_exam_question', {
                'question_number': index + 1,
                'question_type': this.state.currentQuestion.type,
                'difficulty': this.state.currentQuestion.difficulty
            });
        }
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('exam-container')) {
        Examen.init();
    }
});

// ===== EXPORTAR =====
window.Examen = Examen;
