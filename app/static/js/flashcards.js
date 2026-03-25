/* ============================================
   FLASHCARDS - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE FLASHCARDS =====
const Flashcards = {
    // Configuración específica
    config: {
        cardsPerSession: 20,
        reviewLimit: 50,
        srsEnabled: true,
        autoAdvance: true,
        showExamples: true,
        showNotes: true,
        enableAudio: true
    },
    
    // Estado de la aplicación
    state: {
        cards: [],
        currentCard: null,
        currentIndex: 0,
        filteredCards: [],
        categories: [],
        selectedCategory: 'all',
        selectedDifficulty: 'all',
        studyMode: 'random',
        showingBack: false,
        isLoading: false,
        stats: {
            studied: 0,
            correct: 0,
            streak: 0,
            mastered: 0
        },
        history: [],
        bookmarks: [],
        lastSync: null
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Flashcards iniciado');
        
        // Cargar datos
        this.loadCards();
        this.loadCategories();
        this.loadStats();
        this.loadHistory();
        this.loadBookmarks();
        
        // Inicializar componentes
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.initSwipeGestures();
        this.initAudio();
        
        // Cargar última sesión
        this.loadLastSession();
    },

    // ===== CARGA DE DATOS =====
    loadCards: function() {
        this.setState('isLoading', true);
        
        App.apiRequest('/flashcards/all', 'GET')
            .then(data => {
                this.state.cards = data;
                this.state.filteredCards = [...data];
                this.updateStats();
                this.updateCategories();
                this.displayCard(0);
                this.updateUI();
            })
            .catch(error => {
                console.error('Error cargando flashcards:', error);
                App.showNotification('Error al cargar las flashcards', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    loadCategories: function() {
        App.apiRequest('/flashcards/categories', 'GET')
            .then(data => {
                this.state.categories = data.categories;
                this.populateCategoryFilter();
            });
    },

    loadStats: function() {
        App.apiRequest('/flashcards/stats', 'GET')
            .then(data => {
                this.state.stats = data;
                this.updateStatsDisplay();
            });
    },

    loadHistory: function() {
        const saved = localStorage.getItem('flashcards_history');
        if (saved) {
            this.state.history = JSON.parse(saved);
        }
    },

    loadBookmarks: function() {
        const saved = localStorage.getItem('flashcards_bookmarks');
        if (saved) {
            this.state.bookmarks = JSON.parse(saved);
        }
    },

    loadLastSession: function() {
        const lastSession = localStorage.getItem('flashcards_last_session');
        if (lastSession) {
            const session = JSON.parse(lastSession);
            this.state.studyMode = session.mode || 'random';
            this.state.selectedCategory = session.category || 'all';
            this.state.selectedDifficulty = session.difficulty || 'all';
            this.applyFilters();
        }
    },

    // ===== MANEJO DE TARJETAS =====
    displayCard: function(index) {
        if (this.state.filteredCards.length === 0) {
            this.showEmptyState();
            return;
        }

        this.state.currentIndex = (index + this.state.filteredCards.length) % this.state.filteredCards.length;
        this.state.currentCard = this.state.filteredCards[this.state.currentIndex];
        this.state.showingBack = false;

        this.updateCardUI();
        this.updateProgress();
        this.updateNavigationButtons();
        this.saveLastSession();
    },

    updateCardUI: function() {
        if (!this.state.currentCard) return;

        const card = this.state.currentCard;

        // Actualizar contenido frontal
        document.getElementById('front-text').textContent = card.front || 'Sin contenido';
        document.getElementById('front-category').textContent = card.category || 'General';
        document.getElementById('front-difficulty').textContent = card.difficulty || 'intermediate';
        
        // Actualizar contenido dorsal
        document.getElementById('back-text').textContent = card.back || 'Sin traducción';
        document.getElementById('back-category').textContent = card.category || 'General';
        
        // Actualizar badges de dificultad
        this.updateDifficultyBadge(card.difficulty);
        
        // Mostrar ejemplo si existe
        if (card.example && this.config.showExamples) {
            document.getElementById('example-text').textContent = card.example;
            document.getElementById('example-section').style.display = 'block';
        } else {
            document.getElementById('example-section').style.display = 'none';
        }
        
        // Mostrar notas si existen
        if (card.notes && this.config.showNotes) {
            document.getElementById('notes-text').textContent = card.notes;
            document.getElementById('notes-section').style.display = 'block';
        } else {
            document.getElementById('notes-section').style.display = 'none';
        }
        
        // Actualizar estadísticas de la tarjeta
        document.getElementById('review-count').textContent = card.times_reviewed || 0;
        document.getElementById('correct-count').textContent = card.times_correct || 0;
        document.getElementById('success-rate').textContent = (card.success_rate || 0) + '%';
        
        // Actualizar tags
        this.updateTags(card.tags);
        
        // Actualizar estado de bookmark
        this.updateBookmarkStatus();
    },

    updateDifficultyBadge: function(difficulty) {
        const badge = document.getElementById('front-difficulty');
        badge.className = 'badge difficulty';
        
        const classes = {
            'easy': 'bg-success',
            'intermediate': 'bg-warning',
            'advanced': 'bg-danger'
        };
        
        badge.classList.add(classes[difficulty] || 'bg-secondary');
    },

    updateTags: function(tags) {
        const container = document.getElementById('tags-container');
        if (!tags) {
            container.innerHTML = '';
            return;
        }

        const tagArray = tags.split(',').map(t => t.trim());
        container.innerHTML = tagArray.map(tag => 
            `<span class="badge bg-secondary me-1">#${tag}</span>`
        ).join('');
    },

    updateBookmarkStatus: function() {
        const btn = document.getElementById('bookmark-btn');
        if (!btn) return;

        const isBookmarked = this.state.bookmarks.includes(this.state.currentCard.id);
        btn.innerHTML = isBookmarked ? 
            '<i class="fas fa-bookmark"></i>' : 
            '<i class="far fa-bookmark"></i>';
        btn.classList.toggle('active', isBookmarked);
    },

    flipCard: function() {
        this.state.showingBack = !this.state.showingBack;
        
        const front = document.getElementById('card-front');
        const back = document.getElementById('card-back');
        const flipBtn = document.getElementById('flip-btn');
        
        if (this.state.showingBack) {
            front.style.display = 'none';
            back.style.display = 'block';
            flipBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Ver Frente';
            this.enableRatingButtons();
            this.trackView();
        } else {
            front.style.display = 'block';
            back.style.display = 'none';
            flipBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Ver Dorso';
            this.disableRatingButtons();
        }
        
        // Animación
        document.getElementById('flashcard-container').classList.add('flip-animation');
        setTimeout(() => {
            document.getElementById('flashcard-container').classList.remove('flip-animation');
        }, 300);
    },

    rateCard: function(isCorrect) {
        const card = this.state.currentCard;
        
        App.apiRequest('/flashcards/rate', 'POST', {
            card_id: card.id,
            is_correct: isCorrect
        }).then(() => {
            // Actualizar estadísticas locales
            card.times_reviewed = (card.times_reviewed || 0) + 1;
            if (isCorrect) {
                card.times_correct = (card.times_correct || 0) + 1;
                this.state.stats.correct++;
                this.state.stats.streak++;
                
                // Verificar si está dominada
                if (card.times_correct >= 5 && (card.times_correct / card.times_reviewed) >= 0.8) {
                    this.handleMasteredCard(card);
                }
            } else {
                this.state.stats.streak = 0;
            }
            
            this.state.stats.studied++;
            
            // Guardar en historial
            this.addToHistory(card, isCorrect);
            
            // Feedback visual
            this.showFeedback(isCorrect);
            
            // Actualizar UI
            this.updateStatsDisplay();
            
            // Auto-avanzar
            if (this.config.autoAdvance) {
                setTimeout(() => {
                    this.nextCard();
                }, 1000);
            }
        }).catch(error => {
            console.error('Error calificando tarjeta:', error);
            App.showNotification('Error al guardar la calificación', 'error');
        });
    },

    handleMasteredCard: function(card) {
        this.state.stats.mastered++;
        App.showNotification(`¡Has dominado "${card.front}"! 🎉`, 'success');
        
        // Emitir evento para logros
        document.dispatchEvent(new CustomEvent('cardMastered', {
            detail: { card: card }
        }));
    },

    showFeedback: function(isCorrect) {
        const container = document.getElementById('flashcard-container');
        container.classList.add(isCorrect ? 'correct-flash' : 'incorrect-flash');
        
        setTimeout(() => {
            container.classList.remove('correct-flash', 'incorrect-flash');
        }, 500);
    },

    addToHistory: function(card, isCorrect) {
        const entry = {
            id: card.id,
            front: card.front,
            back: card.back,
            isCorrect: isCorrect,
            timestamp: new Date().toISOString()
        };
        
        this.state.history.unshift(entry);
        if (this.state.history.length > 50) {
            this.state.history.pop();
        }
        
        localStorage.setItem('flashcards_history', JSON.stringify(this.state.history));
    },

    // ===== NAVEGACIÓN =====
    nextCard: function() {
        if (this.config.autoAdvance && !this.state.showingBack) {
            this.flipCard();
            return;
        }
        
        let nextIndex;
        
        switch(this.state.studyMode) {
            case 'random':
                nextIndex = Math.floor(Math.random() * this.state.filteredCards.length);
                break;
            case 'due':
                nextIndex = this.findNextDueCard();
                break;
            case 'weak':
                nextIndex = this.findWeakCard();
                break;
            default:
                nextIndex = (this.state.currentIndex + 1) % this.state.filteredCards.length;
        }
        
        this.displayCard(nextIndex);
    },

    previousCard: function() {
        const prevIndex = (this.state.currentIndex - 1 + this.state.filteredCards.length) % this.state.filteredCards.length;
        this.displayCard(prevIndex);
    },

    findNextDueCard: function() {
        const now = new Date();
        const dueCards = this.state.filteredCards.filter(card => 
            card.next_review && new Date(card.next_review) <= now
        );
        
        if (dueCards.length > 0) {
            const randomDue = Math.floor(Math.random() * dueCards.length);
            return this.state.filteredCards.indexOf(dueCards[randomDue]);
        }
        
        return Math.floor(Math.random() * this.state.filteredCards.length);
    },

    findWeakCard: function() {
        const weakCards = this.state.filteredCards
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => (card.success_rate || 0) < 50)
            .sort((a, b) => (a.card.success_rate || 0) - (b.card.success_rate || 0));
        
        if (weakCards.length > 0) {
            return weakCards[0].index;
        }
        
        return Math.floor(Math.random() * this.state.filteredCards.length);
    },

    jumpToCard: function(index) {
        this.displayCard(index);
    },

    // ===== FILTROS =====
    applyFilters: function() {
        this.state.filteredCards = [...this.state.cards];
        
        // Filtrar por categoría
        if (this.state.selectedCategory !== 'all') {
            this.state.filteredCards = this.state.filteredCards.filter(
                card => card.category === this.state.selectedCategory
            );
        }
        
        // Filtrar por dificultad
        if (this.state.selectedDifficulty !== 'all') {
            this.state.filteredCards = this.state.filteredCards.filter(
                card => card.difficulty === this.state.selectedDifficulty
            );
        }
        
        // Aplicar modo de estudio
        switch(this.state.studyMode) {
            case 'due':
                this.state.filteredCards = this.state.filteredCards.filter(card => 
                    card.next_review && new Date(card.next_review) <= new Date()
                );
                break;
            case 'weak':
                this.state.filteredCards.sort((a, b) => 
                    (a.success_rate || 0) - (b.success_rate || 0)
                );
                break;
            case 'new':
                this.state.filteredCards = this.state.filteredCards.filter(card => 
                    (card.times_reviewed || 0) === 0
                );
                break;
            case 'mastered':
                this.state.filteredCards = this.state.filteredCards.filter(card => 
                    (card.success_rate || 0) >= 80
                );
                break;
            case 'bookmarks':
                this.state.filteredCards = this.state.filteredCards.filter(card => 
                    this.state.bookmarks.includes(card.id)
                );
                break;
        }
        
        // Actualizar UI
        this.updateFilterCount();
        this.displayCard(0);
        this.updateThumbnails();
    },

    updateFilterCount: function() {
        const count = this.state.filteredCards.length;
        document.getElementById('filtered-count').textContent = count;
    },

    // ===== PROGRESO Y ESTADÍSTICAS =====
    updateProgress: function() {
        const progress = ((this.state.currentIndex + 1) / this.state.filteredCards.length) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
    },

    updateStatsDisplay: function() {
        document.getElementById('studied-count').textContent = this.state.stats.studied;
        document.getElementById('correct-count-total').textContent = this.state.stats.correct;
        document.getElementById('streak-count').textContent = this.state.stats.streak;
        document.getElementById('mastered-count').textContent = this.state.stats.mastered;
        
        const accuracy = this.state.stats.studied > 0 ? 
            Math.round((this.state.stats.correct / this.state.stats.studied) * 100) : 0;
        document.getElementById('accuracy-display').textContent = accuracy + '%';
    },

    updateStats: function() {
        this.state.stats.studied = this.state.cards.filter(c => c.times_reviewed > 0).length;
        this.state.stats.correct = this.state.cards.reduce((sum, c) => sum + (c.times_correct || 0), 0);
        this.state.stats.mastered = this.state.cards.filter(c => (c.success_rate || 0) >= 80).length;
    },

    // ===== MINIATURAS =====
    updateThumbnails: function() {
        const container = document.getElementById('thumbnails-grid');
        if (!container) return;

        let html = '';
        this.state.filteredCards.slice(0, 20).forEach((card, index) => {
            const isActive = index === this.state.currentIndex;
            const isBookmarked = this.state.bookmarks.includes(card.id);
            
            html += `
                <div class="thumbnail-card ${isActive ? 'active' : ''}" 
                     onclick="Flashcards.jumpToCard(${index})">
                    <div class="thumbnail-preview">
                        <span class="badge bg-${this.getDifficultyColor(card.difficulty)}">
                            ${card.difficulty || 'int'}
                        </span>
                        ${isBookmarked ? '<i class="fas fa-bookmark bookmark-icon"></i>' : ''}
                    </div>
                    <div class="thumbnail-info">
                        <div class="thumbnail-title">${card.front.substring(0, 20)}...</div>
                        <div class="thumbnail-meta">
                            <span>${card.times_reviewed || 0} rep</span>
                            <span>${card.success_rate || 0}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    getDifficultyColor: function(difficulty) {
        const colors = {
            'easy': 'success',
            'intermediate': 'warning',
            'advanced': 'danger'
        };
        return colors[difficulty] || 'secondary';
    },

    // ===== MARCADORES =====
    toggleBookmark: function() {
        const cardId = this.state.currentCard.id;
        const index = this.state.bookmarks.indexOf(cardId);
        
        if (index === -1) {
            this.state.bookmarks.push(cardId);
            App.showNotification('Añadido a marcadores', 'success');
        } else {
            this.state.bookmarks.splice(index, 1);
            App.showNotification('Eliminado de marcadores', 'info');
        }
        
        localStorage.setItem('flashcards_bookmarks', JSON.stringify(this.state.bookmarks));
        this.updateBookmarkStatus();
        this.updateThumbnails();
    },

    // ===== REPASO AUTOMÁTICO (SRS) =====
    scheduleReview: function(card, isCorrect) {
        if (!this.config.srsEnabled) return;
        
        const now = new Date();
        let daysToAdd = 1;
        
        if (isCorrect) {
            const ef = card.easinessFactor || 2.5;
            const interval = card.interval || 1;
            
            daysToAdd = interval * ef;
            card.easinessFactor = ef + 0.1;
        } else {
            daysToAdd = 1;
            card.easinessFactor = 2.5;
        }
        
        card.interval = daysToAdd;
        card.next_review = new Date(now.setDate(now.getDate() + daysToAdd));
    },

    // ===== EVENTOS =====
    initEventListeners: function() {
        // Botones principales
        document.getElementById('flip-btn')?.addEventListener('click', () => this.flipCard());
        document.getElementById('correct-btn')?.addEventListener('click', () => this.rateCard(true));
        document.getElementById('incorrect-btn')?.addEventListener('click', () => this.rateCard(false));
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextCard());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousCard());
        document.getElementById('bookmark-btn')?.addEventListener('click', () => this.toggleBookmark());
        document.getElementById('shuffle-btn')?.addEventListener('click', () => this.shuffleCards());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetSession());
        
        // Filtros
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.state.selectedCategory = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('difficulty-filter')?.addEventListener('change', (e) => {
            this.state.selectedDifficulty = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('study-mode')?.addEventListener('change', (e) => {
            this.state.studyMode = e.target.value;
            this.applyFilters();
        });
        
        // Botones de acción rápida
        document.querySelectorAll('.quick-study-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startQuickStudy(e.target.dataset.mode);
            });
        });
    },

    initKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ignorar si hay un input activo
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.previousCard();
                    break;
                case '1':
                case 'c':
                    this.rateCard(true);
                    break;
                case '2':
                case 'i':
                    this.rateCard(false);
                    break;
                case 'b':
                    this.toggleBookmark();
                    break;
            }
        });
    },

    initSwipeGestures: function() {
        const container = document.getElementById('flashcard-container');
        if (!container) return;

        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, false);

        this.handleSwipe = function() {
            const swipeThreshold = 100;
            const diff = touchEndX - touchStartX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    this.previousCard();
                } else {
                    this.nextCard();
                }
            }
        };
    },

    initAudio: function() {
        if (!this.config.enableAudio) return;
        
        // Precargar sonidos
        this.sounds = {
            correct: new Audio('/static/sounds/correct.mp3'),
            incorrect: new Audio('/static/sounds/incorrect.mp3'),
            flip: new Audio('/static/sounds/flip.mp3'),
            bookmark: new Audio('/static/sounds/bookmark.mp3')
        };
    },

    playSound: function(soundName) {
        if (this.config.enableAudio && this.sounds && this.sounds[soundName]) {
            this.sounds[soundName].play().catch(() => {});
        }
    },

    // ===== ACCIONES =====
    shuffleCards: function() {
        this.state.filteredCards = this.shuffleArray([...this.state.filteredCards]);
        this.displayCard(0);
        App.showNotification('Cartas mezcladas', 'info');
    },

    resetSession: function() {
        this.state.stats = {
            studied: 0,
            correct: 0,
            streak: 0,
            mastered: 0
        };
        this.updateStatsDisplay();
        this.applyFilters();
        App.showNotification('Sesión reiniciada', 'info');
    },

    startQuickStudy: function(mode) {
        const count = 10;
        let cards = [];
        
        switch(mode) {
            case 'weak':
                cards = this.state.cards
                    .filter(c => (c.success_rate || 0) < 50)
                    .sort((a, b) => (a.success_rate || 0) - (b.success_rate || 0))
                    .slice(0, count);
                break;
            case 'new':
                cards = this.state.cards
                    .filter(c => (c.times_reviewed || 0) === 0)
                    .slice(0, count);
                break;
            case 'due':
                const now = new Date();
                cards = this.state.cards
                    .filter(c => c.next_review && new Date(c.next_review) <= now)
                    .slice(0, count);
                break;
            case 'mastered':
                cards = this.state.cards
                    .filter(c => (c.success_rate || 0) >= 80)
                    .slice(0, count);
                break;
        }
        
        this.state.filteredCards = cards;
        this.displayCard(0);
        App.showNotification(`Estudiando ${cards.length} cartas`, 'info');
    },

    // ===== UTILIDADES =====
    setState: function(key, value) {
        this.state[key] = value;
        this.updateUI();
    },

    updateUI: function() {
        this.enableRatingButtons(false);
        this.updateNavigationButtons();
    },

    enableRatingButtons: function(enabled = true) {
        document.getElementById('correct-btn').disabled = !enabled;
        document.getElementById('incorrect-btn').disabled = !enabled;
    },

    disableRatingButtons: function() {
        this.enableRatingButtons(false);
    },

    updateNavigationButtons: function() {
        const hasCards = this.state.filteredCards.length > 0;
        document.getElementById('prev-btn').disabled = !hasCards;
        document.getElementById('next-btn').disabled = !hasCards;
        document.getElementById('flip-btn').disabled = !hasCards;
    },

    showEmptyState: function() {
        document.getElementById('flashcard-container').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group empty-icon"></i>
                <h3>No hay flashcards</h3>
                <p>No se encontraron flashcards con los filtros seleccionados.</p>
                <button class="btn btn-primary" onclick="Flashcards.resetFilters()">
                    <i class="fas fa-redo-alt"></i> Reiniciar filtros
                </button>
            </div>
        `;
    },

    resetFilters: function() {
        this.state.selectedCategory = 'all';
        this.state.selectedDifficulty = 'all';
        this.state.studyMode = 'random';
        
        document.getElementById('category-filter').value = 'all';
        document.getElementById('difficulty-filter').value = 'all';
        document.getElementById('study-mode').value = 'random';
        
        this.applyFilters();
    },

    populateCategoryFilter: function() {
        const select = document.getElementById('category-filter');
        if (!select) return;

        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            select.appendChild(option);
        });
    },

    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    saveLastSession: function() {
        const session = {
            mode: this.state.studyMode,
            category: this.state.selectedCategory,
            difficulty: this.state.selectedDifficulty,
            index: this.state.currentIndex,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('flashcards_last_session', JSON.stringify(session));
    },

    trackView: function() {
        // Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view_flashcard', {
                'card_id': this.state.currentCard.id,
                'category': this.state.currentCard.category,
                'difficulty': this.state.currentCard.difficulty
            });
        }
    },

    // ===== EXPORTACIÓN =====
    exportProgress: function() {
        const data = {
            stats: this.state.stats,
            history: this.state.history,
            bookmarks: this.state.bookmarks,
            masteredCards: this.state.cards.filter(c => (c.success_rate || 0) >= 80).map(c => c.id),
            exportDate: new Date().toISOString()
        };
        
        App.downloadFile(
            JSON.stringify(data, null, 2),
            `flashcards-progress-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    },

    importProgress: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.state.stats = data.stats;
                this.state.history = data.history;
                this.state.bookmarks = data.bookmarks;
                
                this.updateStatsDisplay();
                localStorage.setItem('flashcards_history', JSON.stringify(data.history));
                localStorage.setItem('flashcards_bookmarks', JSON.stringify(data.bookmarks));
                
                App.showNotification('Progreso importado correctamente', 'success');
            } catch (error) {
                App.showNotification('Error al importar el archivo', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('flashcards-container')) {
        Flashcards.init();
    }
});

// ===== EXPORTAR =====
window.Flashcards = Flashcards;
