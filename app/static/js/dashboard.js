/* ============================================
   DASHBOARD - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DEL DASHBOARD =====
const Dashboard = {
    // Configuración específica del dashboard
    config: {
        refreshInterval: 30000, // 30 segundos
        chartsEnabled: true,
        maxRecentActivities: 10,
        defaultTimeRange: 'week'
    },
    
    // Estado del dashboard
    state: {
        stats: null,
        recentActivities: [],
        achievements: [],
        goals: {},
        charts: {},
        currentTimeRange: 'week',
        isLoading: false,
        lastUpdated: null
    },
    
    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Dashboard iniciado');
        
        // Cargar datos iniciales
        this.loadDashboardData();
        
        // Inicializar componentes
        this.initCharts();
        this.initEventListeners();
        this.initRefreshTimer();
        this.initDragAndDrop();
        
        // Actualizar UI
        this.updateUI();
    },
    
    // ===== CARGA DE DATOS =====
    loadDashboardData: function() {
        this.setState('isLoading', true);
        
        Promise.all([
            this.loadStats(),
            this.loadRecentActivities(),
            this.loadAchievements(),
            this.loadGoals()
        ]).then(() => {
            this.setState('isLoading', false);
            this.setState('lastUpdated', new Date());
            this.updateUI();
        }).catch(error => {
            console.error('Error cargando datos del dashboard:', error);
            App.showNotification('Error al cargar los datos del dashboard', 'error');
            this.setState('isLoading', false);
        });
    },
    
    loadStats: function() {
        return App.apiRequest('/dashboard/stats', 'GET')
            .then(data => {
                this.state.stats = data;
                this.updateStatsCards();
            });
    },
    
    loadRecentActivities: function() {
        return App.apiRequest('/dashboard/recent-activities', 'GET')
            .then(data => {
                this.state.recentActivities = data.slice(0, this.config.maxRecentActivities);
                this.updateRecentActivities();
            });
    },
    
    loadAchievements: function() {
        return App.apiRequest('/dashboard/achievements', 'GET')
            .then(data => {
                this.state.achievements = data;
                this.updateAchievements();
            });
    },
    
    loadGoals: function() {
        return App.apiRequest('/dashboard/goals', 'GET')
            .then(data => {
                this.state.goals = data;
                this.updateGoals();
            });
    },
    
    loadChartData: function(chartId, timeRange) {
        return App.apiRequest(`/dashboard/charts/${chartId}?range=${timeRange}`, 'GET')
            .then(data => {
                this.updateChart(chartId, data);
            });
    },
    
    // ===== ACTUALIZACIÓN DE UI =====
    updateUI: function() {
        this.updateLastUpdated();
        this.updateStatsCards();
        this.updateRecentActivities();
        this.updateAchievements();
        this.updateGoals();
    },
    
    updateLastUpdated: function() {
        const element = document.getElementById('last-updated');
        if (element && this.state.lastUpdated) {
            element.textContent = App.formatDate(this.state.lastUpdated);
        }
    },
    
    updateStatsCards: function() {
        if (!this.state.stats) return;
        
        // Actualizar tarjetas de estadísticas
        const stats = this.state.stats;
        
        this.updateStatCard('total-practices', stats.totalPractices);
        this.updateStatCard('correct-answers', stats.correctAnswers);
        this.updateStatCard('accuracy', stats.accuracy + '%');
        this.updateStatCard('streak', stats.streak);
        this.updateStatCard('flashcards-studied', stats.flashcardsStudied);
        this.updateStatCard('total-time', this.formatTime(stats.totalTime));
        
        // Actualizar cambios porcentuales
        this.updateStatChange('total-practices-change', stats.practicesChange);
        this.updateStatChange('correct-answers-change', stats.accuracyChange);
    },
    
    updateStatCard: function(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            this.animateValue(element, value);
        }
    },
    
    updateStatChange: function(id, change) {
        const element = document.getElementById(id);
        if (element) {
            const isPositive = change > 0;
            element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
            element.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                ${Math.abs(change)}%
            `;
        }
    },
    
    updateRecentActivities: function() {
        const container = document.getElementById('recent-activities');
        if (!container) return;
        
        if (this.state.recentActivities.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('actividades');
            return;
        }
        
        let html = '';
        this.state.recentActivities.forEach(activity => {
            html += this.getActivityHTML(activity);
        });
        
        container.innerHTML = html;
    },
    
    getActivityHTML: function(activity) {
        const date = new Date(activity.createdAt);
        const timeAgo = this.getTimeAgo(date);
        
        return `
            <div class="activity-item animate-fade-in">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-type">${this.getActivityTypeName(activity.type)}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-result ${activity.isCorrect ? 'correct' : 'incorrect'}">
                        <i class="fas fa-${activity.isCorrect ? 'check' : 'times'}"></i>
                        ${activity.isCorrect ? 'Correcto' : 'Incorrecto'}
                    </div>
                </div>
            </div>
        `;
    },
    
    getActivityIcon: function(type) {
        const icons = {
            'practice': 'pencil-alt',
            'translation': 'language',
            'flashcard': 'layer-group',
            'exam': 'clipboard-list',
            'achievement': 'trophy'
        };
        return icons[type] || 'circle';
    },
    
    getActivityTypeName: function(type) {
        const names = {
            'practice': 'Práctica',
            'translation': 'Traducción',
            'flashcard': 'Flashcard',
            'exam': 'Examen',
            'achievement': 'Logro'
        };
        return names[type] || type;
    },
    
    getTimeAgo: function(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'hace unos segundos';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        
        const days = Math.floor(hours / 24);
        if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `hace ${months} mes${months !== 1 ? 'es' : ''}`;
        
        const years = Math.floor(months / 12);
        return `hace ${years} año${years !== 1 ? 's' : ''}`;
    },
    
    updateAchievements: function() {
        const container = document.getElementById('achievements-grid');
        if (!container) return;
        
        if (this.state.achievements.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('logros');
            return;
        }
        
        let html = '';
        this.state.achievements.forEach(achievement => {
            html += this.getAchievementHTML(achievement);
        });
        
        container.innerHTML = html;
    },
    
    getAchievementHTML: function(achievement) {
        const progress = (achievement.current / achievement.total) * 100;
        const isCompleted = achievement.current >= achievement.total;
        
        return `
            <div class="achievement-card ${isCompleted ? 'completed' : 'locked'}">
                <div class="achievement-icon ${achievement.rarity}">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <div class="achievement-info">
                    <h4 class="achievement-name">${achievement.name}</h4>
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${achievement.current}/${achievement.total}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    updateGoals: function() {
        const container = document.getElementById('goals-container');
        if (!container) return;
        
        if (!this.state.goals) {
            container.innerHTML = this.getEmptyStateHTML('metas');
            return;
        }
        
        let html = '';
        for (const [key, goal] of Object.entries(this.state.goals)) {
            html += this.getGoalHTML(key, goal);
        }
        
        container.innerHTML = html;
    },
    
    getGoalHTML: function(key, goal) {
        const progress = (goal.current / goal.target) * 100;
        
        return `
            <div class="goal-card">
                <div class="goal-header">
                    <h4 class="goal-title">${goal.name}</h4>
                    <span class="goal-value">${goal.current}/${goal.target}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${key}" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="goal-footer">
                    <span class="goal-deadline">${goal.deadline ? 'Vence: ' + goal.deadline : ''}</span>
                    <button class="btn-edit-goal" onclick="Dashboard.editGoal('${key}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    getEmptyStateHTML: function(type) {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox empty-icon"></i>
                <h4 class="empty-title">No hay ${type}</h4>
                <p class="empty-text">Comienza a practicar para ver tu progreso</p>
                <a href="/practice" class="btn btn-primary">Ir a practicar</a>
            </div>
        `;
    },
    
    // ===== GRÁFICOS =====
    initCharts: function() {
        if (!this.config.chartsEnabled || typeof Chart === 'undefined') return;
        
        this.initProgressChart();
        this.initDistributionChart();
        this.initAccuracyChart();
        this.initActivityHeatmap();
    },
    
    initProgressChart: function() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;
        
        this.loadChartData('progress', this.state.currentTimeRange).then(data => {
            const ctx = canvas.getContext('2d');
            
            this.state.charts.progress = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Prácticas',
                        data: data.practices,
                        borderColor: '#4a6fa5',
                        backgroundColor: 'rgba(74, 111, 165, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Correctas',
                        data: data.correct,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: this.getChartOptions('Progreso semanal')
            });
        });
    },
    
    initDistributionChart: function() {
        const canvas = document.getElementById('distribution-chart');
        if (!canvas) return;
        
        this.loadChartData('distribution', this.state.currentTimeRange).then(data => {
            const ctx = canvas.getContext('2d');
            
            this.state.charts.distribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#4a6fa5',
                            '#6b4e71',
                            '#ffb347',
                            '#4caf50',
                            '#00acc1'
                        ],
                        borderWidth: 0
                    }]
                },
                options: this.getChartOptions('Distribución por tipo', true)
            });
        });
    },
    
    initAccuracyChart: function() {
        const canvas = document.getElementById('accuracy-chart');
        if (!canvas) return;
        
        this.loadChartData('accuracy', this.state.currentTimeRange).then(data => {
            const ctx = canvas.getContext('2d');
            
            this.state.charts.accuracy = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Precisión (%)',
                        data: data.values,
                        backgroundColor: data.values.map(v => 
                            v >= 80 ? '#4caf50' : v >= 60 ? '#ffb347' : '#f44336'
                        ),
                        borderRadius: 5
                    }]
                },
                options: this.getChartOptions('Precisión por día')
            });
        });
    },
    
    initActivityHeatmap: function() {
        const container = document.getElementById('activity-heatmap');
        if (!container) return;
        
        this.loadChartData('heatmap', 'month').then(data => {
            // Aquí iría la lógica para crear el heatmap
            // Podría usar una librería como Cal-Heatmap
        });
    },
    
    getChartOptions: function(title, showLegend = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend,
                    position: 'bottom'
                },
                title: {
                    display: !!title,
                    text: title
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        };
    },
    
    updateChart: function(chartId, data) {
        const chart = this.state.charts[chartId];
        if (!chart) return;
        
        chart.data.labels = data.labels;
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data = data.datasets[index].data;
        });
        chart.update();
    },
    
    // ===== FUNCIONALIDADES INTERACTIVAS =====
    initEventListeners: function() {
        // Botones de rango de tiempo
        document.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimeRange(e.target.dataset.range);
            });
        });
        
        // Botón de actualizar
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.refreshDashboard();
        });
        
        // Botón de exportar datos
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // Botones de filtro de actividades
        document.querySelectorAll('.activity-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterActivities(e.target.dataset.filter);
            });
        });
    },
    
    initRefreshTimer: function() {
        setInterval(() => {
            this.refreshDashboard();
        }, this.config.refreshInterval);
    },
    
    initDragAndDrop: function() {
        const draggables = document.querySelectorAll('.draggable-card');
        const containers = document.querySelectorAll('.dashboard-grid');
        
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', this.handleDragStart);
            draggable.addEventListener('dragend', this.handleDragEnd);
        });
        
        containers.forEach(container => {
            container.addEventListener('dragover', this.handleDragOver);
            container.addEventListener('drop', this.handleDrop);
        });
    },
    
    handleDragStart: function(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
    },
    
    handleDragEnd: function(e) {
        e.target.classList.remove('dragging');
    },
    
    handleDragOver: function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },
    
    handleDrop: function(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const draggable = document.getElementById(id);
        const dropZone = e.target.closest('.dashboard-grid');
        
        if (dropZone && draggable) {
            dropZone.appendChild(draggable);
            Dashboard.saveLayout();
        }
    },
    
    saveLayout: function() {
        const layout = {};
        document.querySelectorAll('.dashboard-grid').forEach((grid, index) => {
            layout[`grid-${index}`] = Array.from(grid.children).map(child => child.id);
        });
        
        localStorage.setItem('dashboard-layout', JSON.stringify(layout));
        App.showNotification('Layout guardado', 'success');
    },
    
    loadLayout: function() {
        const saved = localStorage.getItem('dashboard-layout');
        if (!saved) return;
        
        try {
            const layout = JSON.parse(saved);
            // Aquí iría la lógica para restaurar el layout
        } catch (e) {
            console.error('Error cargando layout:', e);
        }
    },
    
    // ===== FILTROS Y RANGOS =====
    setTimeRange: function(range) {
        this.state.currentTimeRange = range;
        
        // Actualizar UI de botones
        document.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
        
        // Recargar datos con el nuevo rango
        this.refreshDashboard();
    },
    
    filterActivities: function(filter) {
        // Actualizar UI de filtros
        document.querySelectorAll('.activity-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Filtrar actividades
        if (filter === 'all') {
            this.loadRecentActivities();
        } else {
            App.apiRequest(`/dashboard/activities?filter=${filter}`, 'GET')
                .then(data => {
                    this.state.recentActivities = data;
                    this.updateRecentActivities();
                });
        }
    },
    
    // ===== ACCIONES =====
    refreshDashboard: function() {
        this.setState('isLoading', true);
        
        Promise.all([
            this.loadStats(),
            this.loadRecentActivities(),
            this.loadAchievements(),
            this.loadGoals(),
            this.loadChartData('progress', this.state.currentTimeRange),
            this.loadChartData('distribution', this.state.currentTimeRange),
            this.loadChartData('accuracy', this.state.currentTimeRange)
        ]).then(() => {
            this.setState('isLoading', false);
            this.setState('lastUpdated', new Date());
            App.showNotification('Dashboard actualizado', 'success');
        }).catch(error => {
            console.error('Error actualizando dashboard:', error);
            this.setState('isLoading', false);
        });
    },
    
    exportData: function() {
        const data = {
            stats: this.state.stats,
            activities: this.state.recentActivities,
            achievements: this.state.achievements,
            goals: this.state.goals,
            exportedAt: new Date().toISOString()
        };
        
        App.downloadFile(
            JSON.stringify(data, null, 2),
            `dashboard-data-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    },
    
    editGoal: function(goalKey) {
        const modal = document.getElementById('edit-goal-modal');
        if (!modal) return;
        
        const goal = this.state.goals[goalKey];
        
        document.getElementById('edit-goal-key').value = goalKey;
        document.getElementById('edit-goal-name').value = goal.name;
        document.getElementById('edit-goal-target').value = goal.target;
        document.getElementById('edit-goal-current').value = goal.current;
        document.getElementById('edit-goal-deadline').value = goal.deadline || '';
        
        new bootstrap.Modal(modal).show();
    },
    
    saveGoal: function() {
        const goalKey = document.getElementById('edit-goal-key').value;
        const goalData = {
            name: document.getElementById('edit-goal-name').value,
            target: parseInt(document.getElementById('edit-goal-target').value),
            current: parseInt(document.getElementById('edit-goal-current').value),
            deadline: document.getElementById('edit-goal-deadline').value
        };
        
        App.apiRequest('/dashboard/goals', 'POST', {
            key: goalKey,
            goal: goalData
        }).then(() => {
            this.state.goals[goalKey] = goalData;
            this.updateGoals();
            bootstrap.Modal.getInstance(document.getElementById('edit-goal-modal')).hide();
            App.showNotification('Meta actualizada', 'success');
        });
    },
    
    // ===== UTILIDADES =====
    setState: function(key, value) {
        this.state[key] = value;
        this.updateLoadingState();
    },
    
    updateLoadingState: function() {
        if (this.state.isLoading) {
            App.showLoader();
        } else {
            App.hideLoader();
        }
    },
    
    animateValue: function(element, newValue) {
        element.classList.add('value-changed');
        setTimeout(() => {
            element.classList.remove('value-changed');
        }, 500);
    },
    
    formatTime: function(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    },
    
    // ===== GUÍA DE INICIO RÁPIDO =====
    showQuickGuide: function() {
        const guideSteps = [
            {
                title: 'Bienvenido a tu Dashboard',
                description: 'Aquí puedes ver todo tu progreso de un vistazo.'
            },
            {
                title: 'Estadísticas',
                description: 'Las tarjetas superiores muestran tus métricas principales.'
            },
            {
                title: 'Gráficos',
                description: 'Visualiza tu progreso a lo largo del tiempo.'
            },
            {
                title: 'Actividades recientes',
                description: 'Mantén un registro de tus últimas prácticas.'
            },
            {
                title: 'Logros',
                description: 'Desbloquea logros mientras practicas.'
            }
        ];
        
        // Implementar tour guiado
        if (typeof introJs !== 'undefined') {
            introJs().setOptions({
                steps: guideSteps
            }).start();
        }
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dashboard-container')) {
        Dashboard.init();
    }
});

// ===== EXPORTAR =====
window.Dashboard = Dashboard;
