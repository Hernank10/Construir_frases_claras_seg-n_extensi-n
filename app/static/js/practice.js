/* ============================================
   PRÁCTICA - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE PRÁCTICA =====
const Practice = {
    // Configuración específica
    config: {
        maxAttempts: 3,
        showHints: true,
        autoAdvance: true,
        soundEnabled: true,
        timeLimit: 0, // 0 = sin límite
        pointsCorrect: 10,
        pointsIncorrect: -5,
        streakBonus: 5
    },

    // Estado de la práctica
    state: {
        mode: 'order', // order, translation, rewrite
        currentExercise: null,
        exercises: [],
        filteredExercises: [],
        currentIndex: 0,
        selectedComponents: [],
        userAnswer: '',
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        attempts: 0,
        timeRemaining: 0,
        timer: null,
        isCompleted: false,
        isLoading: false,
        hints: [],
        history: []
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Práctica iniciada en modo:', this.state.mode);

        // Cargar ejercicios
        this.loadExercises();

        // Inicializar componentes
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.initTimer();
        this.loadHistory();

        // Actualizar UI
        this.updateModeUI();
        this.updateStats();
    },

    // ===== CARGA DE EJERCICIOS =====
    loadExercises: function() {
        this.setState('isLoading', true);

        App.apiRequest('/exercises/all', 'GET')
            .then(data => {
                this.state.exercises = data;
                this.state.filteredExercises = [...data];
                this.loadNextExercise();
            })
            .catch(error => {
                console.error('Error cargando ejercicios:', error);
                App.showNotification('Error al cargar los ejercicios', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    loadNextExercise: function() {
        if (this.state.filteredExercises.length === 0) {
            this.showEmptyState();
            return;
        }

        // Seleccionar ejercicio aleatorio
        const randomIndex = Math.floor(Math.random() * this.state.filteredExercises.length);
        this.state.currentExercise = this.state.filteredExercises[randomIndex];
        this.state.currentIndex = randomIndex;
        this.state.attempts = 0;
        this.state.selectedComponents = [];
        this.state.userAnswer = '';
        this.state.hints = [];

        this.updateExerciseUI();
        this.resetTimer();
    },

    loadSpecificExercise: function(index) {
        if (index >= 0 && index < this.state.filteredExercises.length) {
            this.state.currentExercise = this.state.filteredExercises[index];
            this.state.currentIndex = index;
            this.state.attempts = 0;
            this.state.selectedComponents = [];
            this.state.userAnswer = '';
            this.state.hints = [];

            this.updateExerciseUI();
            this.resetTimer();
        }
    },

    // ===== CONFIGURACIÓN DE MODO =====
    setMode: function(mode) {
        this.state.mode = mode;
        this.updateModeUI();
        this.loadNextExercise();

        // Actualizar botones activos
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        App.showNotification(`Modo: ${this.getModeName(mode)}`, 'info');
    },

    getModeName: function(mode) {
        const names = {
            'order': 'Ordenar componentes',
            'translation': 'Traducción',
            'rewrite': 'Reescribir'
        };
        return names[mode] || mode;
    },

    updateModeUI: function() {
        const container = document.getElementById('exercise-container');
        if (!container) return;

        switch(this.state.mode) {
            case 'order':
                this.setupOrderMode();
                break;
            case 'translation':
                this.setupTranslationMode();
                break;
            case 'rewrite':
                this.setupRewriteMode();
                break;
        }
    },

    setupOrderMode: function() {
        document.getElementById('components-section').style.display = 'block';
        document.getElementById('selected-order-section').style.display = 'block';
        document.getElementById('text-input-section').style.display = 'none';
        document.getElementById('spanish-sentence').style.display = 'block';
        
        this.displayComponents();
        this.updateSelectedOrder();
    },

    setupTranslationMode: function() {
        document.getElementById('components-section').style.display = 'none';
        document.getElementById('selected-order-section').style.display = 'none';
        document.getElementById('text-input-section').style.display = 'block';
        document.getElementById('spanish-sentence').style.display = 'block';
        
        document.getElementById('text-input').value = '';
        document.getElementById('text-input').placeholder = 'Escribe la traducción al inglés...';
    },

    setupRewriteMode: function() {
        document.getElementById('components-section').style.display = 'none';
        document.getElementById('selected-order-section').style.display = 'none';
        document.getElementById('text-input-section').style.display = 'block';
        document.getElementById('spanish-sentence').style.display = 'block';
        
        document.getElementById('text-input').value = '';
        document.getElementById('text-input').placeholder = 'Reescribe la frase correctamente...';
        
        // Mostrar versión incorrecta
        const badOrder = this.getBadOrder();
        document.getElementById('spanish-sentence').innerHTML = `
            <span class="badge bg-warning">Frase desordenada</span>
            <p class="mt-2">${badOrder}</p>
        `;
    },

    // ===== COMPONENTES PARA MODO ORDEN =====
    displayComponents: function() {
        if (!this.state.currentExercise) return;

        const components = [...this.state.currentExercise.components];
        const shuffled = this.shuffleArray(components);

        const container = document.getElementById('components-list');
        container.innerHTML = '';

        shuffled.forEach(comp => {
            const btn = document.createElement('button');
            btn.className = 'component-btn btn btn-outline-primary';
            btn.textContent = comp;
            btn.onclick = () => this.addComponent(comp, btn);
            container.appendChild(btn);
        });
    },

    addComponent: function(component, btn) {
        if (this.state.selectedComponents.length < 4 && 
            !this.state.selectedComponents.includes(component)) {
            
            this.state.selectedComponents.push(component);
            btn.disabled = true;
            this.updateSelectedOrder();

            if (this.state.selectedComponents.length === 4) {
                document.getElementById('check-btn').disabled = false;
            }
        }
    },

    removeComponent: function(index) {
        const component = this.state.selectedComponents[index];
        this.state.selectedComponents.splice(index, 1);

        // Rehabilitar el botón correspondiente
        document.querySelectorAll('.component-btn').forEach(btn => {
            if (btn.textContent === component) {
                btn.disabled = false;
            }
        });

        this.updateSelectedOrder();
        document.getElementById('check-btn').disabled = true;
    },

    updateSelectedOrder: function() {
        const container = document.getElementById('selected-order');
        container.innerHTML = '';

        if (this.state.selectedComponents.length === 0) {
            container.innerHTML = '<em class="text-muted">Haz clic en los componentes para ordenarlos</em>';
            return;
        }

        this.state.selectedComponents.forEach((comp, index) => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary p-3 order-chip';
            badge.innerHTML = `
                <span class="order-number">${index + 1}</span>
                ${comp}
                <i class="fas fa-times ms-2 remove-component" onclick="Practice.removeComponent(${index})"></i>
            `;
            container.appendChild(badge);
        });
    },

    resetOrder: function() {
        this.state.selectedComponents = [];
        document.querySelectorAll('.component-btn').forEach(btn => {
            btn.disabled = false;
        });
        this.updateSelectedOrder();
        document.getElementById('check-btn').disabled = true;
    },

    // ===== VERIFICACIÓN DE RESPUESTAS =====
    checkAnswer: function() {
        if (!this.state.currentExercise) return;

        let isCorrect = false;
        let correctAnswer = '';
        let userAnswer = '';

        switch(this.state.mode) {
            case 'order':
                userAnswer = this.state.selectedComponents.join(' ');
                correctAnswer = this.state.currentExercise.components.join(' ');
                isCorrect = userAnswer === correctAnswer;
                break;

            case 'translation':
                userAnswer = document.getElementById('text-input').value.trim();
                correctAnswer = this.state.currentExercise.english;
                isCorrect = this.compareTranslations(userAnswer, correctAnswer);
                break;

            case 'rewrite':
                userAnswer = document.getElementById('text-input').value.trim();
                correctAnswer = this.state.currentExercise.components.join(' ');
                isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                break;
        }

        this.processResult(isCorrect, userAnswer, correctAnswer);
    },

    compareTranslations: function(user, correct) {
        // Comparación flexible (ignorar mayúsculas, puntuación, artículos)
        const normalize = (text) => {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        return normalize(user) === normalize(correct);
    },

    processResult: function(isCorrect, userAnswer, correctAnswer) {
        this.state.attempts++;

        // Calcular puntos
        let points = isCorrect ? this.config.pointsCorrect : this.config.pointsIncorrect;
        
        if (isCorrect) {
            this.state.streak++;
            this.state.correctCount++;
            
            // Bonus por racha
            if (this.state.streak >= 3) {
                points += this.config.streakBonus;
            }
        } else {
            this.state.streak = 0;
            this.state.incorrectCount++;
        }

        this.state.score += points;

        // Guardar en historial
        this.addToHistory(isCorrect, userAnswer);

        // Mostrar feedback
        this.showFeedback(isCorrect, correctAnswer, points);

        // Actualizar estadísticas
        this.updateStats();

        // Verificar si debe avanzar
        if (this.config.autoAdvance && isCorrect) {
            setTimeout(() => {
                this.nextExercise();
            }, 1500);
        } else if (this.state.attempts >= this.config.maxAttempts) {
            setTimeout(() => {
                this.nextExercise();
            }, 2000);
        }

        // Deshabilitar botón de verificar
        document.getElementById('check-btn').disabled = true;

        // Reproducir sonido
        if (this.config.soundEnabled) {
            this.playSound(isCorrect ? 'correct' : 'incorrect');
        }
    },

    showFeedback: function(isCorrect, correctAnswer, points) {
        const container = document.getElementById('feedback-container');
        const icon = isCorrect ? 'check-circle' : 'times-circle';
        const className = isCorrect ? 'success' : 'danger';
        const pointsText = points > 0 ? `+${points}` : points;

        container.innerHTML = `
            <div class="alert alert-${className} feedback-alert">
                <i class="fas fa-${icon} me-2"></i>
                <strong>${isCorrect ? '¡Correcto!' : 'Incorrecto'}</strong>
                <span class="points-badge">${pointsText} puntos</span>
                ${!isCorrect ? `<div class="mt-2">Respuesta correcta: "${correctAnswer}"</div>` : ''}
            </div>
        `;

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    },

    // ===== NAVEGACIÓN =====
    nextExercise: function() {
        this.loadNextExercise();
        document.getElementById('check-btn').disabled = true;
        document.getElementById('feedback-container').innerHTML = '';
    },

    previousExercise: function() {
        if (this.state.history.length > 0) {
            const lastExercise = this.state.history[this.state.history.length - 1];
            // Cargar el ejercicio anterior
            App.showNotification('Función en desarrollo', 'info');
        }
    },

    // ===== TEMPORIZADOR =====
    initTimer: function() {
        if (this.config.timeLimit > 0) {
            this.state.timeRemaining = this.config.timeLimit * 60;
            this.startTimer();
        }
    },

    startTimer: function() {
        this.state.timer = setInterval(() => {
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
        }, 1000);
    },

    resetTimer: function() {
        if (this.config.timeLimit > 0) {
            this.state.timeRemaining = this.config.timeLimit * 60;
            document.getElementById('timer-display').classList.remove('timer-warning');
        }
    },

    timeOut: function() {
        clearInterval(this.state.timer);
        App.showNotification('¡Tiempo agotado!', 'warning');
        this.nextExercise();
    },

    // ===== ESTADÍSTICAS =====
    updateStats: function() {
        document.getElementById('score-display').textContent = this.state.score;
        document.getElementById('correct-count').textContent = this.state.correctCount;
        document.getElementById('incorrect-count').textContent = this.state.incorrectCount;
        document.getElementById('streak-display').textContent = this.state.streak;

        const accuracy = this.state.correctCount + this.state.incorrectCount > 0 ?
            Math.round((this.state.correctCount / (this.state.correctCount + this.state.incorrectCount)) * 100) : 0;
        document.getElementById('accuracy-display').textContent = accuracy + '%';
    },

    // ===== HISTORIAL =====
    addToHistory: function(isCorrect, userAnswer) {
        const entry = {
            exerciseId: this.state.currentExercise.id,
            mode: this.state.mode,
            spanish: this.state.currentExercise.spanish,
            userAnswer: userAnswer,
            correctAnswer: this.getCorrectAnswer(),
            isCorrect: isCorrect,
            timestamp: new Date().toISOString()
        };

        this.state.history.push(entry);

        // Guardar en localStorage
        localStorage.setItem('practice_history', JSON.stringify(this.state.history));

        // Actualizar tabla de historial si existe
        this.updateHistoryTable();
    },

    getCorrectAnswer: function() {
        switch(this.state.mode) {
            case 'order':
                return this.state.currentExercise.components.join(' ');
            case 'translation':
                return this.state.currentExercise.english;
            case 'rewrite':
                return this.state.currentExercise.components.join(' ');
        }
    },

    loadHistory: function() {
        const saved = localStorage.getItem('practice_history');
        if (saved) {
            this.state.history = JSON.parse(saved);
            this.updateHistoryTable();
        }
    },

    updateHistoryTable: function() {
        const container = document.getElementById('history-table');
        if (!container) return;

        if (this.state.history.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay historial aún</p>';
            return;
        }

        const recent = this.state.history.slice(-10).reverse();
        let html = '<table class="table table-sm"><thead><tr><th>Tipo</th><th>Resultado</th><th>Hora</th></tr></thead><tbody>';

        recent.forEach(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString();
            html += `
                <tr class="${entry.isCorrect ? 'table-success' : 'table-danger'}">
                    <td>${this.getModeName(entry.mode)}</td>
                    <td>${entry.isCorrect ? '✓' : '✗'}</td>
                    <td>${timeStr}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    // ===== PISTAS =====
    getHint: function() {
        if (!this.state.currentExercise || !this.config.showHints) return;

        const exercise = this.state.currentExercise;
        let hint = '';

        switch(this.state.mode) {
            case 'order':
                hint = `El complemento "${exercise.components[2]}" debería ir antes que "${exercise.components[3]}" por ser más corto.`;
                break;
            case 'translation':
                hint = `Pista: ${exercise.hint || 'Traduce manteniendo la estructura'}`;
                break;
            case 'rewrite':
                hint = `El orden correcto es: ${exercise.components.join(' → ')}`;
                break;
        }

        App.showNotification(hint, 'info');
    },

    // ===== UTILIDADES =====
    getBadOrder: function() {
        if (!this.state.currentExercise) return '';
        const comps = this.state.currentExercise.components;
        return `${comps[0]} ${comps[1]} ${comps[3]} ${comps[2]}`;
    },

    resetExercise: function() {
        this.state.selectedComponents = [];
        this.state.userAnswer = '';
        document.getElementById('text-input').value = '';
        document.querySelectorAll('.component-btn').forEach(btn => {
            btn.disabled = false;
        });
        this.updateSelectedOrder();
        document.getElementById('check-btn').disabled = true;
        document.getElementById('feedback-container').innerHTML = '';
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
        // Actualizar elementos de UI según el estado
        if (this.state.isLoading) {
            App.showLoader();
        } else {
            App.hideLoader();
        }
    },

    showEmptyState: function() {
        document.getElementById('exercise-container').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pencil-alt empty-icon"></i>
                <h3>No hay ejercicios</h3>
                <p>No se encontraron ejercicios disponibles.</p>
                <button class="btn btn-primary" onclick="Practice.loadExercises()">
                    <i class="fas fa-redo-alt"></i> Reintentar
                </button>
            </div>
        `;
    },

    // ===== EVENTOS =====
    initEventListeners: function() {
        // Botones de modo
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // Botones principales
        document.getElementById('check-btn')?.addEventListener('click', () => this.checkAnswer());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetExercise());
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextExercise());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousExercise());
        document.getElementById('hint-btn')?.addEventListener('click', () => this.getHint());

        // Enter en campo de texto
        document.getElementById('text-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.checkAnswer();
            }
        });

        // Botones de filtro de dificultad
        document.querySelectorAll('.difficulty-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByDifficulty(e.target.dataset.difficulty);
            });
        });
    },

    initKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.setMode('order');
                    break;
                case '2':
                    e.preventDefault();
                    this.setMode('translation');
                    break;
                case '3':
                    e.preventDefault();
                    this.setMode('rewrite');
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.checkAnswer();
                    break;
                case 'Escape':
                    this.resetExercise();
                    break;
                case 'n':
                case 'N':
                    this.nextExercise();
                    break;
                case 'h':
                case 'H':
                    this.getHint();
                    break;
            }
        });
    },

    filterByDifficulty: function(difficulty) {
        if (difficulty === 'all') {
            this.state.filteredExercises = [...this.state.exercises];
        } else {
            this.state.filteredExercises = this.state.exercises.filter(
                ex => ex.difficulty === difficulty
            );
        }

        this.loadNextExercise();

        // Actualizar botones activos
        document.querySelectorAll('.difficulty-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        App.showNotification(`Mostrando ejercicios ${difficulty}`, 'info');
    },

    // ===== EXPORTACIÓN =====
    exportProgress: function() {
        const data = {
            stats: {
                score: this.state.score,
                correct: this.state.correctCount,
                incorrect: this.state.incorrectCount,
                streak: this.state.streak
            },
            history: this.state.history,
            exportDate: new Date().toISOString()
        };

        App.downloadFile(
            JSON.stringify(data, null, 2),
            `practice-progress-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    },

    importProgress: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Actualizar estadísticas
                this.state.score = data.stats.score || 0;
                this.state.correctCount = data.stats.correct || 0;
                this.state.incorrectCount = data.stats.incorrect || 0;
                this.state.streak = data.stats.streak || 0;
                
                // Cargar historial
                if (data.history) {
                    this.state.history = [...this.state.history, ...data.history];
                    localStorage.setItem('practice_history', JSON.stringify(this.state.history));
                }

                this.updateStats();
                this.updateHistoryTable();
                
                App.showNotification('Progreso importado correctamente', 'success');
            } catch (error) {
                App.showNotification('Error al importar el archivo', 'error');
            }
        };
        reader.readAsText(file);
    },

    // ===== ESTADÍSTICAS DETALLADAS =====
    showDetailedStats: function() {
        const total = this.state.correctCount + this.state.incorrectCount;
        const accuracy = total > 0 ? (this.state.correctCount / total * 100).toFixed(1) : 0;

        const statsHTML = `
            <div class="detailed-stats">
                <h5>Estadísticas detalladas</h5>
                <table class="table table-sm">
                    <tr>
                        <th>Total ejercicios:</th>
                        <td>${total}</td>
                    </tr>
                    <tr>
                        <th>Correctos:</th>
                        <td>${this.state.correctCount} (${accuracy}%)</td>
                    </tr>
                    <tr>
                        <th>Incorrectos:</th>
                        <td>${this.state.incorrectCount}</td>
                    </tr>
                    <tr>
                        <th>Puntuación:</th>
                        <td>${this.state.score}</td>
                    </tr>
                    <tr>
                        <th>Racha máxima:</th>
                        <td>${this.getMaxStreak()}</td>
                    </tr>
                </table>
            </div>
        `;

        // Mostrar en modal
        const modal = document.getElementById('stats-modal');
        if (modal) {
            document.getElementById('stats-content').innerHTML = statsHTML;
            new bootstrap.Modal(modal).show();
        }
    },

    getMaxStreak: function() {
        let maxStreak = 0;
        let currentStreak = 0;

        this.state.history.forEach(entry => {
            if (entry.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        return maxStreak;
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('practice-container')) {
        Practice.init();
    }
});

// ===== EXPORTAR =====
window.Practice = Practice;
