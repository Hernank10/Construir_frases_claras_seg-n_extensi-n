/* ============================================
   PERFIL DE USUARIO - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE PERFIL =====
const Profile = {
    // Configuración específica
    config: {
        maxAvatarSize: 2 * 1024 * 1024, // 2MB
        allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        minPasswordLength: 8,
        sessionRefreshInterval: 30000, // 30 segundos
        chartColors: {
            primary: '#4a6fa5',
            secondary: '#6b4e71',
            success: '#4caf50',
            warning: '#ff9800',
            danger: '#f44336',
            info: '#00acc1'
        }
    },

    // Estado del perfil
    state: {
        user: null,
        stats: null,
        achievements: [],
        activeSessions: [],
        isEditing: false,
        isLoading: false,
        avatarFile: null,
        charts: {},
        passwordStrength: 0
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Perfil de usuario iniciado');

        // Cargar datos del usuario
        this.loadUserData();
        this.loadStats();
        this.loadAchievements();
        this.loadActiveSessions();

        // Inicializar componentes
        this.initEventListeners();
        this.initCharts();
        this.initPasswordStrengthMeter();

        // Actualizar UI
        this.updateUI();
    },

    // ===== CARGA DE DATOS =====
    loadUserData: function() {
        this.setState('isLoading', true);

        App.apiRequest('/user/profile', 'GET')
            .then(data => {
                this.state.user = data;
                this.populateUserData();
            })
            .catch(error => {
                console.error('Error cargando perfil:', error);
                App.showNotification('Error al cargar los datos del perfil', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    populateUserData: function() {
        if (!this.state.user) return;

        // Datos básicos
        document.getElementById('username-display').textContent = this.state.user.username;
        document.getElementById('email-display').textContent = this.state.user.email;
        document.getElementById('fullname-display').textContent = this.state.user.full_name || 'No especificado';
        document.getElementById('location-display').textContent = this.state.user.location || 'No especificado';
        document.getElementById('bio-display').textContent = this.state.user.bio || 'Sin biografía';

        // Avatar
        const avatarImg = document.getElementById('avatar-img');
        const avatarInitials = document.getElementById('avatar-initials');
        
        if (this.state.user.avatar_url) {
            avatarImg.src = this.state.user.avatar_url;
            avatarImg.style.display = 'block';
            avatarInitials.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarInitials.style.display = 'flex';
            avatarInitials.textContent = this.state.user.username.charAt(0).toUpperCase();
        }

        // Nivel y experiencia
        document.getElementById('user-level').textContent = this.state.user.level || 1;
        document.getElementById('user-xp').textContent = `${this.state.user.xp || 0}/${this.state.user.next_level_xp || 1000}`;
        
        const xpPercentage = ((this.state.user.xp || 0) / (this.state.user.next_level_xp || 1000)) * 100;
        document.getElementById('xp-progress-bar').style.width = xpPercentage + '%';
    },

    loadStats: function() {
        App.apiRequest('/user/stats', 'GET')
            .then(data => {
                this.state.stats = data;
                this.populateStats();
            })
            .catch(error => {
                console.error('Error cargando estadísticas:', error);
            });
    },

    populateStats: function() {
        if (!this.state.stats) return;

        document.getElementById('total-practices').textContent = this.state.stats.total_practices || 0;
        document.getElementById('correct-answers').textContent = this.state.stats.correct_answers || 0;
        document.getElementById('accuracy').textContent = (this.state.stats.accuracy || 0) + '%';
        document.getElementById('streak').textContent = this.state.stats.streak || 0;
        document.getElementById('total-time').textContent = this.formatTime(this.state.stats.total_minutes || 0);
        document.getElementById('flashcards-studied').textContent = this.state.stats.flashcards_studied || 0;
        document.getElementById('exams-taken').textContent = this.state.stats.exams_taken || 0;
        document.getElementById('best-score').textContent = (this.state.stats.best_score || 0) + '%';
    },

    loadAchievements: function() {
        App.apiRequest('/user/achievements', 'GET')
            .then(data => {
                this.state.achievements = data;
                this.populateAchievements();
            })
            .catch(error => {
                console.error('Error cargando logros:', error);
            });
    },

    populateAchievements: function() {
        const container = document.getElementById('achievements-list');
        if (!container) return;

        if (this.state.achievements.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Aún no has obtenido logros. ¡Sigue practicando!</p>';
            return;
        }

        container.innerHTML = this.state.achievements.map(ach => `
            <div class="achievement-card ${ach.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon ${ach.rarity}">
                    <i class="fas fa-${ach.icon}"></i>
                </div>
                <div class="achievement-info">
                    <h5 class="achievement-name">${ach.name}</h5>
                    <p class="achievement-description">${ach.description}</p>
                    ${ach.progress !== undefined ? `
                        <div class="achievement-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(ach.current / ach.total) * 100}%"></div>
                            </div>
                            <span class="progress-text">${ach.current}/${ach.total}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    loadActiveSessions: function() {
        App.apiRequest('/user/sessions', 'GET')
            .then(data => {
                this.state.activeSessions = data;
                this.populateSessions();
            })
            .catch(error => {
                console.error('Error cargando sesiones:', error);
            });
    },

    populateSessions: function() {
        const container = document.getElementById('sessions-list');
        if (!container) return;

        if (this.state.activeSessions.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay sesiones activas</p>';
            return;
        }

        container.innerHTML = this.state.activeSessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-icon">
                        <i class="fas fa-${session.device === 'mobile' ? 'mobile-alt' : 'laptop'}"></i>
                    </div>
                    <div class="session-details">
                        <div class="session-device">${session.device_name || 'Dispositivo desconocido'}</div>
                        <div class="session-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${session.location || 'Desconocida'}</span>
                            <span><i class="fas fa-clock"></i> Último acceso: ${new Date(session.last_active).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="session-actions">
                    ${session.is_current ? 
                        '<span class="badge bg-success">Actual</span>' : 
                        `<button class="btn btn-sm btn-outline-danger" onclick="Profile.terminateSession(${session.id})">
                            <i class="fas fa-times"></i> Terminar
                        </button>`
                    }
                </div>
            </div>
        `).join('');
    },

    // ===== EDICIÓN DE PERFIL =====
    enableEdit: function() {
        this.state.isEditing = true;

        // Cargar valores actuales en el formulario
        document.getElementById('edit-fullname').value = this.state.user.full_name || '';
        document.getElementById('edit-location').value = this.state.user.location || '';
        document.getElementById('edit-bio').value = this.state.user.bio || '';

        // Mostrar modal de edición
        const modal = new bootstrap.Modal(document.getElementById('edit-profile-modal'));
        modal.show();
    },

    saveProfile: function() {
        const data = {
            full_name: document.getElementById('edit-fullname').value.trim(),
            location: document.getElementById('edit-location').value.trim(),
            bio: document.getElementById('edit-bio').value.trim()
        };

        this.setState('isLoading', true);

        App.apiRequest('/user/update', 'POST', data)
            .then(() => {
                // Actualizar datos locales
                this.state.user = { ...this.state.user, ...data };
                this.populateUserData();
                
                bootstrap.Modal.getInstance(document.getElementById('edit-profile-modal')).hide();
                App.showNotification('Perfil actualizado correctamente', 'success');
            })
            .catch(error => {
                App.showNotification('Error al actualizar el perfil', 'error');
                console.error(error);
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    // ===== AVATAR =====
    triggerAvatarUpload: function() {
        document.getElementById('avatar-upload').click();
    },

    handleAvatarUpload: function(file) {
        if (!file) return;

        // Validar tamaño
        if (file.size > this.config.maxAvatarSize) {
            App.showNotification(`La imagen no debe superar los ${this.config.maxAvatarSize / (1024*1024)}MB`, 'warning');
            return;
        }

        // Validar tipo
        if (!this.config.allowedAvatarTypes.includes(file.type)) {
            App.showNotification('Formato no permitido. Usa JPG, PNG, GIF o WebP', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Mostrar preview
            document.getElementById('avatar-img').src = e.target.result;
            document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-initials').style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Subir al servidor
        const formData = new FormData();
        formData.append('avatar', file);

        this.setState('isLoading', true);

        fetch('/api/user/avatar', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                App.showNotification('Avatar actualizado', 'success');
            } else {
                throw new Error(data.message || 'Error al subir avatar');
            }
        })
        .catch(error => {
            App.showNotification('Error al subir avatar', 'error');
            console.error(error);
            // Revertir preview
            if (this.state.user.avatar_url) {
                document.getElementById('avatar-img').src = this.state.user.avatar_url;
            } else {
                document.getElementById('avatar-img').style.display = 'none';
                document.getElementById('avatar-initials').style.display = 'flex';
            }
        })
        .finally(() => {
            this.setState('isLoading', false);
        });
    },

    // ===== CAMBIO DE CONTRASEÑA =====
    initPasswordStrengthMeter: function() {
        const passwordInput = document.getElementById('new-password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            let strength = 0;

            if (password.length >= 8) strength += 25;
            if (/[a-z]/.test(password)) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password)) strength += 15;
            if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

            this.state.passwordStrength = strength;

            const bar = document.getElementById('password-strength-bar');
            const text = document.getElementById('password-strength-text');

            bar.style.width = strength + '%';
            
            if (strength < 40) {
                bar.className = 'bg-danger';
                text.textContent = 'Débil';
            } else if (strength < 70) {
                bar.className = 'bg-warning';
                text.textContent = 'Media';
            } else {
                bar.className = 'bg-success';
                text.textContent = 'Fuerte';
            }
        });
    },

    changePassword: function() {
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (newPass !== confirm) {
            App.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        if (newPass.length < this.config.minPasswordLength) {
            App.showNotification(`La contraseña debe tener al menos ${this.config.minPasswordLength} caracteres`, 'warning');
            return;
        }

        this.setState('isLoading', true);

        App.apiRequest('/user/change-password', 'POST', {
            current_password: current,
            new_password: newPass
        })
        .then(() => {
            App.showNotification('Contraseña cambiada correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('change-password-modal')).hide();
            document.getElementById('change-password-form').reset();
            this.state.passwordStrength = 0;
            document.getElementById('password-strength-bar').style.width = '0%';
            document.getElementById('password-strength-text').textContent = '';
        })
        .catch(error => {
            App.showNotification(error.message || 'Error al cambiar la contraseña', 'error');
        })
        .finally(() => {
            this.setState('isLoading', false);
        });
    },

    // ===== AUTENTICACIÓN DE DOS FACTORES =====
    toggleTwoFactor: function() {
        const enabled = document.getElementById('two-factor-checkbox').checked;

        this.setState('isLoading', true);

        App.apiRequest('/user/2fa/toggle', 'POST', { enabled: enabled })
            .then(data => {
                if (enabled && data.secret) {
                    this.showTwoFactorSetup(data.secret, data.qr_code);
                } else {
                    App.showNotification('Autenticación de dos factores desactivada', 'info');
                }
            })
            .catch(error => {
                App.showNotification('Error al configurar 2FA', 'error');
                // Revertir checkbox
                document.getElementById('two-factor-checkbox').checked = !enabled;
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    showTwoFactorSetup: function(secret, qrCode) {
        // Mostrar modal con instrucciones
        const modal = document.getElementById('2fa-setup-modal');
        document.getElementById('2fa-secret').textContent = secret;
        document.getElementById('2fa-qr').innerHTML = `<img src="${qrCode}" alt="QR Code">`;
        
        new bootstrap.Modal(modal).show();
    },

    verifyTwoFactor: function() {
        const code = document.getElementById('2fa-code').value;

        App.apiRequest('/user/2fa/verify', 'POST', { code: code })
            .then(() => {
                App.showNotification('2FA activado correctamente', 'success');
                bootstrap.Modal.getInstance(document.getElementById('2fa-setup-modal')).hide();
            })
            .catch(error => {
                App.showNotification('Código inválido', 'error');
            });
    },

    // ===== SESIONES ACTIVAS =====
    terminateSession: function(sessionId) {
        if (!confirm('¿Terminar esta sesión?')) return;

        this.setState('isLoading', true);

        App.apiRequest(`/user/sessions/${sessionId}/terminate`, 'POST')
            .then(() => {
                this.state.activeSessions = this.state.activeSessions.filter(s => s.id !== sessionId);
                this.populateSessions();
                App.showNotification('Sesión terminada', 'success');
            })
            .catch(error => {
                App.showNotification('Error al terminar la sesión', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    terminateAllSessions: function() {
        if (!confirm('¿Terminar todas las demás sesiones?')) return;

        this.setState('isLoading', true);

        App.apiRequest('/user/sessions/terminate-all', 'POST')
            .then(() => {
                this.state.activeSessions = this.state.activeSessions.filter(s => s.is_current);
                this.populateSessions();
                App.showNotification('Sesiones terminadas', 'success');
            })
            .catch(error => {
                App.showNotification('Error al terminar las sesiones', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    // ===== ELIMINAR CUENTA =====
    showDeleteAccountModal: function() {
        new bootstrap.Modal(document.getElementById('delete-account-modal')).show();
    },

    deleteAccount: function() {
        const confirmText = document.getElementById('delete-confirm').value;
        if (confirmText !== 'ELIMINAR') {
            App.showNotification('Por favor escribe "ELIMINAR" para confirmar', 'warning');
            return;
        }

        this.setState('isLoading', true);

        App.apiRequest('/user/delete', 'POST')
            .then(() => {
                App.showNotification('Cuenta eliminada. Redirigiendo...', 'success');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '/';
                }, 2000);
            })
            .catch(error => {
                App.showNotification('Error al eliminar la cuenta', 'error');
                this.setState('isLoading', false);
            });
    },

    // ===== GRÁFICOS =====
    initCharts: function() {
        if (typeof Chart === 'undefined') return;

        // Gráfico de progreso semanal
        const weeklyCtx = document.getElementById('weekly-chart');
        if (weeklyCtx) {
            this.state.charts.weekly = new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: this.getLast7Days(),
                    datasets: [{
                        label: 'Prácticas',
                        data: this.state.stats?.weekly_practices || [0,0,0,0,0,0,0],
                        borderColor: this.config.chartColors.primary,
                        backgroundColor: 'rgba(74,111,165,0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Gráfico de precisión por tipo
        const accuracyCtx = document.getElementById('accuracy-chart');
        if (accuracyCtx) {
            this.state.charts.accuracy = new Chart(accuracyCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Orden', 'Traducción', 'Flashcards'],
                    datasets: [{
                        data: [
                            this.state.stats?.accuracy_order || 0,
                            this.state.stats?.accuracy_translation || 0,
                            this.state.stats?.accuracy_flashcards || 0
                        ],
                        backgroundColor: [
                            this.config.chartColors.primary,
                            this.config.chartColors.secondary,
                            this.config.chartColors.success
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    cutout: '70%'
                }
            });
        }
    },

    getLast7Days: function() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
        }
        return days;
    },

    // ===== PREFERENCIAS DE IDIOMA =====
    updateLanguage: function() {
        const uiLang = document.getElementById('ui-language').value;
        const practiceLang = document.getElementById('practice-language').value;

        App.apiRequest('/user/language', 'POST', {
            ui_language: uiLang,
            practice_language: practiceLang
        })
        .then(() => {
            App.setLanguage(uiLang);
            App.showNotification('Preferencias de idioma actualizadas', 'success');
        })
        .catch(error => {
            App.showNotification('Error al actualizar preferencias', 'error');
        });
    },

    // ===== NOTIFICACIONES =====
    updateNotificationSettings: function() {
        const settings = {
            email_notifications: document.getElementById('email-notifications').checked,
            practice_reminders: document.getElementById('practice-reminders').checked,
            achievement_alerts: document.getElementById('achievement-alerts').checked,
            newsletter: document.getElementById('newsletter').checked
        };

        App.apiRequest('/user/notifications', 'POST', settings)
            .then(() => {
                App.showNotification('Preferencias de notificaciones actualizadas', 'success');
            })
            .catch(error => {
                App.showNotification('Error al actualizar notificaciones', 'error');
            });
    },

    // ===== UTILIDADES =====
    formatTime: function(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
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
        // Botones de edición
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => this.enableEdit());
        document.getElementById('save-profile-btn')?.addEventListener('click', () => this.saveProfile());

        // Avatar
        document.getElementById('avatar-upload-btn')?.addEventListener('click', () => this.triggerAvatarUpload());
        document.getElementById('avatar-upload')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAvatarUpload(e.target.files[0]);
            }
        });

        // Cambio de contraseña
        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            new bootstrap.Modal(document.getElementById('change-password-modal')).show();
        });
        document.getElementById('submit-password-btn')?.addEventListener('click', () => this.changePassword());

        // 2FA
        document.getElementById('two-factor-checkbox')?.addEventListener('change', () => this.toggleTwoFactor());
        document.getElementById('verify-2fa-btn')?.addEventListener('click', () => this.verifyTwoFactor());

        // Sesiones
        document.getElementById('terminate-all-btn')?.addEventListener('click', () => this.terminateAllSessions());

        // Eliminar cuenta
        document.getElementById('delete-account-btn')?.addEventListener('click', () => this.showDeleteAccountModal());
        document.getElementById('confirm-delete-btn')?.addEventListener('click', () => this.deleteAccount());

        // Preferencias
        document.getElementById('save-language-btn')?.addEventListener('click', () => this.updateLanguage());
        document.getElementById('save-notifications-btn')?.addEventListener('click', () => this.updateNotificationSettings());

        // Pestañas
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = tab.dataset.bsTarget;
                if (target) {
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show', 'active'));
                    document.querySelector(target).classList.add('show', 'active');
                    
                    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                }
            });
        });

        // Auto-refrescar sesiones cada cierto tiempo
        setInterval(() => {
            if (document.getElementById('sessions-tab').classList.contains('active')) {
                this.loadActiveSessions();
            }
        }, this.config.sessionRefreshInterval);
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('profile-container')) {
        Profile.init();
    }
});

// ===== EXPORTAR =====
window.Profile = Profile;
