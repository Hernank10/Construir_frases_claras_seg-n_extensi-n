/* ============================================
   REGISTRO DE USUARIO - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DE REGISTRO =====
const Register = {
    // Configuración específica
    config: {
        minUsernameLength: 3,
        maxUsernameLength: 20,
        minPasswordLength: 8,
        passwordRequirements: {
            length: 8,
            uppercase: true,
            lowercase: true,
            number: true,
            special: true
        },
        steps: ['basic', 'security', 'additional', 'preferences'],
        socialProviders: ['google', 'facebook', 'github', 'twitter']
    },

    // Estado del registro
    state: {
        currentStep: 0,
        formData: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            country: '',
            referral: '',
            uiLanguage: 'es',
            practiceLanguage: 'es-en',
            spanishLevel: 'beginner',
            newsletter: true,
            terms: false
        },
        errors: {},
        usernameAvailable: null,
        emailValid: null,
        passwordStrength: 0,
        isLoading: false,
        timer: null
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Registro iniciado');

        // Inicializar componentes
        this.initEventListeners();
        this.initPasswordStrengthMeter();
        this.initStepIndicators();
        this.initValidationDebounce();

        // Cargar países (opcional)
        this.loadCountries();

        // Actualizar UI
        this.updateStep(0);
    },

    // ===== MANEJO DE PASOS =====
    updateStep: function(step) {
        this.state.currentStep = step;

        // Actualizar indicadores visuales
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === step);
            indicator.classList.toggle('completed', index < step);
        });

        // Mostrar/ocultar pasos
        document.querySelectorAll('.form-step').forEach((stepEl, index) => {
            stepEl.style.display = index === step ? 'block' : 'none';
        });

        // Actualizar botones de navegación
        document.getElementById('prevBtn').disabled = step === 0;
        if (step === this.config.steps.length - 1) {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'block';
        } else {
            document.getElementById('nextBtn').style.display = 'block';
            document.getElementById('submitBtn').style.display = 'none';
        }

        // Actualizar barra de progreso
        const progress = ((step + 1) / this.config.steps.length) * 100;
        document.getElementById('formProgress').style.width = progress + '%';
    },

    nextStep: function() {
        if (this.validateStep(this.state.currentStep)) {
            if (this.state.currentStep < this.config.steps.length - 1) {
                this.updateStep(this.state.currentStep + 1);
            }
        }
    },

    prevStep: function() {
        if (this.state.currentStep > 0) {
            this.updateStep(this.state.currentStep - 1);
        }
    },

    validateStep: function(step) {
        let isValid = true;
        this.state.errors = {};

        switch(step) {
            case 0: // Información básica
                if (!this.state.formData.username) {
                    this.setError('username', 'El nombre de usuario es requerido');
                    isValid = false;
                } else if (this.state.formData.username.length < this.config.minUsernameLength) {
                    this.setError('username', `Mínimo ${this.config.minUsernameLength} caracteres`);
                    isValid = false;
                } else if (this.state.formData.username.length > this.config.maxUsernameLength) {
                    this.setError('username', `Máximo ${this.config.maxUsernameLength} caracteres`);
                    isValid = false;
                } else if (this.state.usernameAvailable === false) {
                    this.setError('username', 'Este nombre de usuario no está disponible');
                    isValid = false;
                }

                if (!this.state.formData.email) {
                    this.setError('email', 'El correo electrónico es requerido');
                    isValid = false;
                } else if (!this.validateEmail(this.state.formData.email)) {
                    this.setError('email', 'Correo electrónico inválido');
                    isValid = false;
                }
                break;

            case 1: // Seguridad
                if (!this.state.formData.password) {
                    this.setError('password', 'La contraseña es requerida');
                    isValid = false;
                } else if (this.state.formData.password.length < this.config.minPasswordLength) {
                    this.setError('password', `Mínimo ${this.config.minPasswordLength} caracteres`);
                    isValid = false;
                } else if (this.state.passwordStrength < 70) {
                    this.setError('password', 'La contraseña no es lo suficientemente segura');
                    isValid = false;
                }

                if (this.state.formData.password !== this.state.formData.confirmPassword) {
                    this.setError('confirmPassword', 'Las contraseñas no coinciden');
                    isValid = false;
                }
                break;

            case 2: // Información adicional (opcional, siempre válido)
                break;

            case 3: // Preferencias
                if (!this.state.formData.terms) {
                    this.setError('terms', 'Debes aceptar los términos y condiciones');
                    isValid = false;
                }
                break;
        }

        this.displayErrors();
        return isValid;
    },

    setError: function(field, message) {
        this.state.errors[field] = message;
    },

    displayErrors: function() {
        // Limpiar errores previos
        document.querySelectorAll('.field-error').forEach(el => el.remove());

        // Mostrar nuevos errores
        Object.keys(this.state.errors).forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = this.state.errors[field];
                input.parentNode.appendChild(errorDiv);
            }
        });
    },

    // ===== VALIDACIONES EN TIEMPO REAL =====
    initValidationDebounce: function() {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');

        if (usernameInput) {
            usernameInput.addEventListener('input', this.debounce(() => {
                this.checkUsernameAvailability(usernameInput.value);
            }, 500));
        }

        if (emailInput) {
            emailInput.addEventListener('input', this.debounce(() => {
                this.validateEmailField(emailInput.value);
            }, 500));
        }
    },

    checkUsernameAvailability: function(username) {
        if (username.length < this.config.minUsernameLength) {
            this.state.usernameAvailable = null;
            return;
        }

        App.apiRequest('/auth/check-username', 'POST', { username })
            .then(data => {
                this.state.usernameAvailable = data.available;
                const feedback = document.getElementById('usernameFeedback');
                if (feedback) {
                    if (data.available) {
                        feedback.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Usuario disponible</span>';
                    } else {
                        feedback.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> Usuario no disponible</span>';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking username:', error);
            });
    },

    validateEmailField: function(email) {
        const isValid = this.validateEmail(email);
        this.state.emailValid = isValid;
        const feedback = document.getElementById('emailFeedback');
        if (feedback) {
            if (isValid) {
                feedback.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Email válido</span>';
            } else if (email.length > 0) {
                feedback.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> Email inválido</span>';
            } else {
                feedback.innerHTML = '';
            }
        }
    },

    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // ===== MEDIDOR DE FORTALEZA DE CONTRASEÑA =====
    initPasswordStrengthMeter: function() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            this.checkPasswordStrength(password);
            this.checkPasswordMatch();
        });

        const confirmInput = document.getElementById('confirmPassword');
        if (confirmInput) {
            confirmInput.addEventListener('input', () => {
                this.checkPasswordMatch();
            });
        }
    },

    checkPasswordStrength: function(password) {
        let strength = 0;

        // Longitud
        if (password.length >= this.config.passwordRequirements.length) strength += 25;

        // Mayúsculas
        if (/[A-Z]/.test(password)) strength += 25;

        // Minúsculas
        if (/[a-z]/.test(password)) strength += 25;

        // Números
        if (/[0-9]/.test(password)) strength += 15;

        // Caracteres especiales
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

        this.state.passwordStrength = strength;

        const bar = document.getElementById('passwordStrength');
        const text = document.getElementById('passwordStrengthText');

        if (bar) {
            bar.style.width = strength + '%';
            if (strength < 40) {
                bar.className = 'progress-bar bg-danger';
                text.textContent = 'Débil';
            } else if (strength < 70) {
                bar.className = 'progress-bar bg-warning';
                text.textContent = 'Media';
            } else {
                bar.className = 'progress-bar bg-success';
                text.textContent = 'Fuerte';
            }
        }

        // Actualizar requisitos visuales
        this.updatePasswordRequirements(password);
    },

    updatePasswordRequirements: function(password) {
        const reqs = {
            length: password.length >= this.config.passwordRequirements.length,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9]/.test(password)
        };

        Object.keys(reqs).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                if (reqs[req]) {
                    element.classList.add('met');
                    element.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${element.textContent.trim()}`;
                } else {
                    element.classList.remove('met');
                    element.innerHTML = `<i class="fas fa-circle text-muted"></i> ${element.textContent.trim()}`;
                }
            }
        });
    },

    checkPasswordMatch: function() {
        const password = document.getElementById('password')?.value || '';
        const confirm = document.getElementById('confirmPassword')?.value || '';
        const feedback = document.getElementById('passwordMatchFeedback');

        if (confirm) {
            if (password === confirm) {
                feedback.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Las contraseñas coinciden</span>';
            } else {
                feedback.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> Las contraseñas no coinciden</span>';
            }
        } else {
            feedback.innerHTML = '';
        }
    },

    // ===== REGISTRO =====
    submitRegistration: function() {
        if (!this.validateStep(this.state.currentStep) || !this.validateAllSteps()) {
            return;
        }

        this.setState('isLoading', true);

        const data = {
            username: this.state.formData.username,
            email: this.state.formData.email,
            password: this.state.formData.password,
            full_name: this.state.formData.fullName,
            country: this.state.formData.country,
            referral: this.state.formData.referral,
            ui_language: this.state.formData.uiLanguage,
            practice_language: this.state.formData.practiceLanguage,
            spanish_level: this.state.formData.spanishLevel,
            newsletter: this.state.formData.newsletter
        };

        App.apiRequest('/auth/register', 'POST', data)
            .then(response => {
                App.showNotification('Registro exitoso. Por favor inicia sesión.', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            })
            .catch(error => {
                App.showNotification(error.message || 'Error en el registro', 'error');
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    validateAllSteps: function() {
        let allValid = true;
        for (let i = 0; i < this.config.steps.length; i++) {
            if (!this.validateStep(i)) {
                allValid = false;
            }
        }
        return allValid;
    },

    // ===== REGISTRO SOCIAL =====
    socialLogin: function(provider) {
        // Redirigir a la ruta de autenticación social
        window.location.href = `/auth/${provider}/login`;
    },

    // ===== CARGA DE PAÍSES =====
    loadCountries: function() {
        // Podría cargarse desde una API, pero usamos una lista estática
        const select = document.getElementById('country');
        if (!select) return;

        const countries = [
            { code: 'AR', name: 'Argentina' },
            { code: 'BO', name: 'Bolivia' },
            { code: 'CL', name: 'Chile' },
            { code: 'CO', name: 'Colombia' },
            { code: 'CR', name: 'Costa Rica' },
            { code: 'CU', name: 'Cuba' },
            { code: 'DO', name: 'República Dominicana' },
            { code: 'EC', name: 'Ecuador' },
            { code: 'ES', name: 'España' },
            { code: 'GT', name: 'Guatemala' },
            { code: 'HN', name: 'Honduras' },
            { code: 'MX', name: 'México' },
            { code: 'NI', name: 'Nicaragua' },
            { code: 'PA', name: 'Panamá' },
            { code: 'PE', name: 'Perú' },
            { code: 'PR', name: 'Puerto Rico' },
            { code: 'PY', name: 'Paraguay' },
            { code: 'SV', name: 'El Salvador' },
            { code: 'US', name: 'Estados Unidos' },
            { code: 'UY', name: 'Uruguay' },
            { code: 'VE', name: 'Venezuela' }
        ];

        select.innerHTML = '<option value="">Selecciona tu país</option>';
        countries.forEach(c => {
            const option = document.createElement('option');
            option.value = c.code;
            option.textContent = c.name;
            select.appendChild(option);
        });
    },

    // ===== MANEJO DE FORMULARIO =====
    handleInputChange: function(field, value) {
        this.state.formData[field] = value;

        // Validaciones específicas
        if (field === 'username') {
            if (value.length >= this.config.minUsernameLength) {
                this.checkUsernameAvailability(value);
            } else {
                this.state.usernameAvailable = null;
            }
        }
        if (field === 'email') {
            this.validateEmailField(value);
        }
    },

    // ===== UTILIDADES =====
    initStepIndicators: function() {
        // Ya se maneja en updateStep
    },

    initEventListeners: function() {
        // Botones de navegación
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        document.getElementById('submitBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitRegistration();
        });

        // Campos del formulario
        const fields = ['username', 'email', 'password', 'confirmPassword', 'fullName', 'country', 'referral', 'uiLanguage', 'practiceLanguage', 'spanishLevel', 'newsletter', 'terms'];
        fields.forEach(field => {
            const el = document.getElementById(field);
            if (el) {
                if (el.type === 'checkbox') {
                    el.addEventListener('change', (e) => {
                        this.handleInputChange(field, e.target.checked);
                    });
                } else {
                    el.addEventListener('input', (e) => {
                        this.handleInputChange(field, e.target.value);
                    });
                }
            }
        });

        // Botones de registro social
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                if (provider) {
                    this.socialLogin(provider);
                }
            });
        });

        // Enlace de términos
        document.getElementById('termsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            new bootstrap.Modal(document.getElementById('termsModal')).show();
        });

        document.getElementById('privacyLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            new bootstrap.Modal(document.getElementById('privacyModal')).show();
        });

        // Alternar visibilidad de contraseña
        document.getElementById('togglePassword')?.addEventListener('click', () => {
            const password = document.getElementById('password');
            const icon = document.querySelector('#togglePassword i');
            if (password.type === 'password') {
                password.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                password.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        document.getElementById('toggleConfirmPassword')?.addEventListener('click', () => {
            const confirm = document.getElementById('confirmPassword');
            const icon = document.querySelector('#toggleConfirmPassword i');
            if (confirm.type === 'password') {
                confirm.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                confirm.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    },

    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
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
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('register-container')) {
        Register.init();
    }
});

// ===== EXPORTAR =====
window.Register = Register;
