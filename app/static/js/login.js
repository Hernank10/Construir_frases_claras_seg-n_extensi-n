/* ============================================
   LOGIN - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE LOGIN =====
const Login = {
    // Configuración
    config: {
        minPasswordLength: 8,
        socialLoginEnabled: true,
        rememberMeEnabled: true,
        resetPasswordEnabled: true,
        maxLoginAttempts: 5,
        lockoutTime: 15 * 60 * 1000 // 15 minutos
    },

    // Estado
    state: {
        isLoading: false,
        loginAttempts: 0,
        lastAttemptTime: null,
        isLocked: false,
        showPassword: false,
        rememberMe: localStorage.getItem('remember_me') === 'true'
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Login iniciado');

        // Cargar preferencias guardadas
        this.loadSavedCredentials();

        // Inicializar componentes
        this.initEventListeners();
        this.initValidation();
        this.initSocialButtons();

        // Actualizar UI
        this.updateUI();
    },

    // ===== CREDENCIALES GUARDADAS =====
    loadSavedCredentials: function() {
        if (this.state.rememberMe) {
            const savedUsername = localStorage.getItem('saved_username');
            if (savedUsername) {
                document.getElementById('username').value = savedUsername;
                document.getElementById('remember-me').checked = true;
            }
        }
    },

    // ===== MANEJO DEL FORMULARIO =====
    handleSubmit: function(event) {
        event.preventDefault();

        // Verificar si está bloqueado
        if (this.state.isLocked) {
            const remainingTime = this.getRemainingLockTime();
            App.showNotification(`Demasiados intentos. Intenta de nuevo en ${Math.ceil(remainingTime / 60000)} minutos.`, 'warning');
            return;
        }

        // Obtener valores
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me')?.checked || false;

        // Validar
        if (!this.validateInputs(username, password)) {
            return;
        }

        // Actualizar estado
        this.setState('isLoading', true);
        this.state.loginAttempts++;
        this.state.lastAttemptTime = Date.now();

        // Llamada a la API
        App.apiRequest('/auth/login', 'POST', {
            username: username,
            password: password,
            remember: rememberMe
        })
        .then(response => {
            // Éxito: guardar token y redirigir
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            if (rememberMe) {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('remember_me', 'true');
            } else {
                localStorage.removeItem('saved_username');
                localStorage.setItem('remember_me', 'false');
            }

            App.showNotification('Inicio de sesión exitoso. Redirigiendo...', 'success');

            setTimeout(() => {
                window.location.href = response.redirect || '/dashboard';
            }, 1500);
        })
        .catch(error => {
            // Error: mostrar mensaje
            App.showNotification(error.message || 'Credenciales inválidas', 'error');

            // Bloquear si excede intentos
            if (this.state.loginAttempts >= this.config.maxLoginAttempts) {
                this.lockAccount();
            }
        })
        .finally(() => {
            this.setState('isLoading', false);
        });
    },

    validateInputs: function(username, password) {
        if (!username) {
            App.showNotification('Por favor ingresa tu usuario o email', 'warning');
            return false;
        }

        if (!password) {
            App.showNotification('Por favor ingresa tu contraseña', 'warning');
            return false;
        }

        if (password.length < this.config.minPasswordLength) {
            App.showNotification(`La contraseña debe tener al menos ${this.config.minPasswordLength} caracteres`, 'warning');
            return false;
        }

        return true;
    },

    // ===== BLOQUEO POR INTENTOS =====
    lockAccount: function() {
        this.state.isLocked = true;
        App.showNotification(`Demasiados intentos fallidos. Bloqueado por ${this.config.lockoutTime / 60000} minutos.`, 'error');

        setTimeout(() => {
            this.state.isLocked = false;
            this.state.loginAttempts = 0;
        }, this.config.lockoutTime);
    },

    getRemainingLockTime: function() {
        const elapsed = Date.now() - this.state.lastAttemptTime;
        return Math.max(0, this.config.lockoutTime - elapsed);
    },

    // ===== VISIBILIDAD DE CONTRASEÑA =====
    togglePasswordVisibility: function() {
        this.state.showPassword = !this.state.showPassword;
        const passwordField = document.getElementById('password');
        const toggleIcon = document.getElementById('toggle-password-icon');

        if (this.state.showPassword) {
            passwordField.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    },

    // ===== RECUPERACIÓN DE CONTRASEÑA =====
    showResetModal: function() {
        const modal = new bootstrap.Modal(document.getElementById('reset-password-modal'));
        modal.show();
    },

    sendResetLink: function() {
        const email = document.getElementById('reset-email').value.trim();

        if (!email || !this.validateEmail(email)) {
            App.showNotification('Por favor ingresa un email válido', 'warning');
            return;
        }

        this.setState('isLoading', true);

        App.apiRequest('/auth/reset-password', 'POST', { email: email })
            .then(() => {
                App.showNotification('Se ha enviado un enlace de recuperación a tu email', 'success');
                bootstrap.Modal.getInstance(document.getElementById('reset-password-modal')).hide();
                document.getElementById('reset-email').value = '';
            })
            .catch(error => {
                App.showNotification(error.message || 'Error al enviar el enlace', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // ===== LOGIN SOCIAL =====
    socialLogin: function(provider) {
        if (!this.config.socialLoginEnabled) {
            App.showNotification('El login social no está habilitado', 'warning');
            return;
        }

        this.setState('isLoading', true);

        // Redirigir al endpoint de autenticación social
        window.location.href = `/auth/${provider}`;
    },

    initSocialButtons: function() {
        document.querySelectorAll('.social-login-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider || btn.classList.contains('google') ? 'google' :
                                 btn.classList.contains('facebook') ? 'facebook' :
                                 btn.classList.contains('github') ? 'github' : null;
                if (provider) {
                    this.socialLogin(provider);
                }
            });
        });
    },

    // ===== VALIDACIÓN EN TIEMPO REAL =====
    initValidation: function() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        usernameInput.addEventListener('input', () => {
            if (usernameInput.value.length > 0) {
                usernameInput.classList.remove('is-invalid');
            }
        });

        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length >= this.config.minPasswordLength) {
                passwordInput.classList.remove('is-invalid');
            }
        });
    },

    // ===== RECORDAR SESIÓN =====
    toggleRememberMe: function() {
        this.state.rememberMe = !this.state.rememberMe;
    },

    // ===== UTILIDADES =====
    setState: function(key, value) {
        this.state[key] = value;
        this.updateUI();
    },

    updateUI: function() {
        // Mostrar/ocultar loader
        if (this.state.isLoading) {
            App.showLoader();
            document.getElementById('login-btn').disabled = true;
        } else {
            App.hideLoader();
            document.getElementById('login-btn').disabled = false;
        }

        // Actualizar checkbox de recordar
        const rememberCheckbox = document.getElementById('remember-me');
        if (rememberCheckbox) {
            rememberCheckbox.checked = this.state.rememberMe;
        }
    },

    // ===== EVENTOS =====
    initEventListeners: function() {
        // Formulario de login
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleSubmit(e));

        // Toggle contraseña
        document.getElementById('toggle-password')?.addEventListener('click', () => this.togglePasswordVisibility());

        // Recordar sesión
        document.getElementById('remember-me')?.addEventListener('change', (e) => {
            this.state.rememberMe = e.target.checked;
        });

        // Recuperar contraseña
        document.getElementById('forgot-password')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showResetModal();
        });

        document.getElementById('send-reset-link')?.addEventListener('click', () => this.sendResetLink());

        // Cerrar modal de reset
        document.getElementById('reset-password-modal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('reset-email').value = '';
        });

        // Tecla Enter en el modal de reset
        document.getElementById('reset-email')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendResetLink();
            }
        });

        // Detectar cuando el usuario está bloqueado
        document.addEventListener('keydown', (e) => {
            if (this.state.isLocked && e.target.tagName !== 'BODY') {
                e.preventDefault();
                App.showNotification('Cuenta temporalmente bloqueada. Espera unos minutos.', 'warning');
            }
        });
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('login-form')) {
        Login.init();
    }
});

// ===== EXPORTAR =====
window.Login = Login;
