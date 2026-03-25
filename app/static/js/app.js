/* ============================================
   APLICACIÓN PRINCIPAL - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== VARIABLES GLOBALES =====
const App = {
    // Configuración
    config: {
        apiUrl: '/api',
        debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        version: '1.0.0',
        maxExercises: 100,
        defaultLanguage: 'es',
        animationsEnabled: true
    },
    
    // Estado de la aplicación
    state: {
        user: null,
        isAuthenticated: false,
        currentPage: window.location.pathname,
        loading: false,
        notifications: [],
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'es'
    },
    
    // Inicialización
    init: function() {
        console.log('App iniciada - Versión:', this.config.version);
        
        // Verificar autenticación
        this.checkAuth();
        
        // Cargar preferencias del usuario
        this.loadUserPreferences();
        
        // Inicializar componentes
        this.initComponents();
        
        // Configurar event listeners globales
        this.setupEventListeners();
        
        // Aplicar tema guardado
        this.applyTheme(this.state.theme);
        
        // Mostrar mensaje de bienvenida si es debug
        if (this.config.debug) {
            console.log('Modo debug activado');
        }
    },
    
    // ===== AUTENTICACIÓN =====
    checkAuth: function() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.state.isAuthenticated = true;
            this.loadUserData();
        }
    },
    
    loadUserData: function() {
        this.apiRequest('/user/profile', 'GET')
            .then(user => {
                this.state.user = user;
                this.updateUserUI();
            })
            .catch(error => {
                console.error('Error cargando usuario:', error);
                this.logout();
            });
    },
    
    login: function(credentials) {
        this.state.loading = true;
        this.showLoader();
        
        return this.apiRequest('/auth/login', 'POST', credentials)
            .then(response => {
                localStorage.setItem('auth_token', response.token);
                this.state.isAuthenticated = true;
                this.state.user = response.user;
                this.updateUserUI();
                this.showNotification('Inicio de sesión exitoso', 'success');
                return response;
            })
            .catch(error => {
                this.showNotification(error.message || 'Error al iniciar sesión', 'error');
                throw error;
            })
            .finally(() => {
                this.state.loading = false;
                this.hideLoader();
            });
    },
    
    logout: function() {
        localStorage.removeItem('auth_token');
        this.state.isAuthenticated = false;
        this.state.user = null;
        this.updateUserUI();
        this.showNotification('Sesión cerrada', 'info');
        
        // Redirigir al inicio si es necesario
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    },
    
    register: function(userData) {
        this.state.loading = true;
        this.showLoader();
        
        return this.apiRequest('/auth/register', 'POST', userData)
            .then(response => {
                this.showNotification('Registro exitoso. Por favor inicia sesión.', 'success');
                return response;
            })
            .catch(error => {
                this.showNotification(error.message || 'Error al registrarse', 'error');
                throw error;
            })
            .finally(() => {
                this.state.loading = false;
                this.hideLoader();
            });
    },
    
    // ===== PETICIONES API =====
    apiRequest: async function(endpoint, method = 'GET', data = null) {
        const url = this.config.apiUrl + endpoint;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Añadir token de autenticación si existe
        const token = localStorage.getItem('auth_token');
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Error en la petición');
            }
            
            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // ===== PREFERENCIAS DE USUARIO =====
    loadUserPreferences: function() {
        const language = localStorage.getItem('language');
        if (language) {
            this.setLanguage(language);
        }
        
        const theme = localStorage.getItem('theme');
        if (theme) {
            this.applyTheme(theme);
        }
    },
    
    setLanguage: function(lang) {
        this.state.language = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        
        // Emitir evento de cambio de idioma
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    },
    
    applyTheme: function(theme) {
        this.state.theme = theme;
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // Emitir evento de cambio de tema
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
    },
    
    toggleTheme: function() {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    },
    
    // ===== INTERFAZ DE USUARIO =====
    updateUserUI: function() {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;
        
        if (this.state.isAuthenticated && this.state.user) {
            const userName = document.querySelector('.user-name');
            const userAvatar = document.querySelector('.user-avatar');
            
            if (userName) userName.textContent = this.state.user.username;
            if (userAvatar) {
                userAvatar.textContent = this.state.user.username.charAt(0).toUpperCase();
            }
            
            // Mostrar elementos para usuarios autenticados
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'none');
        } else {
            // Mostrar elementos para usuarios no autenticados
            document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.no-auth').forEach(el => el.style.display = 'block');
        }
    },
    
    showLoader: function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'flex';
        } else {
            // Crear loader si no existe
            this.createLoader();
        }
    },
    
    hideLoader: function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },
    
    createLoader: function() {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'global-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    },
    
    showNotification: function(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            duration: duration
        };
        
        this.state.notifications.push(notification);
        this.renderNotification(notification);
        
        // Auto-eliminar después de la duración
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    },
    
    renderNotification: function(notification) {
        const container = document.getElementById('notification-container');
        if (!container) {
            this.createNotificationContainer();
        }
        
        const notificationEl = document.createElement('div');
        notificationEl.id = `notification-${notification.id}`;
        notificationEl.className = `notification notification-${notification.type} animate-slide-in`;
        notificationEl.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">${notification.message}</div>
            <button class="notification-close" onclick="App.removeNotification(${notification.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('notification-container').appendChild(notificationEl);
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    removeNotification: function(id) {
        const notification = document.getElementById(`notification-${id}`);
        if (notification) {
            notification.classList.add('animate-slide-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
        
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    },
    
    createNotificationContainer: function() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    },
    
    // ===== COMPONENTES =====
    initComponents: function() {
        this.initTooltips();
        this.initPopovers();
        this.initDropdowns();
        this.initModals();
        this.initForms();
        this.initCharts();
    },
    
    initTooltips: function() {
        const tooltips = document.querySelectorAll('[data-toggle="tooltip"]');
        tooltips.forEach(el => {
            // Inicializar tooltips (depende de la librería que uses)
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                new bootstrap.Tooltip(el);
            }
        });
    },
    
    initPopovers: function() {
        const popovers = document.querySelectorAll('[data-toggle="popover"]');
        popovers.forEach(el => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
                new bootstrap.Popover(el);
            }
        });
    },
    
    initDropdowns: function() {
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(el => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                new bootstrap.Dropdown(el);
            }
        });
    },
    
    initModals: function() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(el => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                new bootstrap.Modal(el);
            }
        });
    },
    
    initForms: function() {
        // Validación de formularios
        const forms = document.querySelectorAll('form[data-validate="true"]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
        
        // Auto-resize textareas
        const textareas = document.querySelectorAll('textarea[data-auto-resize="true"]');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', this.autoResizeTextarea);
        });
        
        // Password strength meter
        const passwordInputs = document.querySelectorAll('input[type="password"][data-strength="true"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', this.checkPasswordStrength);
        });
    },
    
    validateForm: function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showInputError(input, 'Este campo es requerido');
                isValid = false;
            } else {
                this.clearInputError(input);
            }
            
            // Validaciones específicas por tipo
            if (input.type === 'email' && input.value) {
                if (!this.validateEmail(input.value)) {
                    this.showInputError(input, 'Email inválido');
                    isValid = false;
                }
            }
            
            if (input.type === 'password' && input.value) {
                if (input.dataset.minLength && input.value.length < input.dataset.minLength) {
                    this.showInputError(input, `Mínimo ${input.dataset.minLength} caracteres`);
                    isValid = false;
                }
            }
        });
        
        return isValid;
    },
    
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    showInputError: function(input, message) {
        input.classList.add('error');
        
        let errorDiv = input.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('input-error')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'input-error';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        errorDiv.textContent = message;
    },
    
    clearInputError: function(input) {
        input.classList.remove('error');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('input-error')) {
            errorDiv.remove();
        }
    },
    
    autoResizeTextarea: function(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    },
    
    checkPasswordStrength: function(e) {
        const password = e.target.value;
        const strengthMeter = document.getElementById('password-strength');
        if (!strengthMeter) return;
        
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]+/)) strength += 25;
        if (password.match(/[A-Z]+/)) strength += 25;
        if (password.match(/[0-9]+/)) strength += 15;
        if (password.match(/[$@#&!]+/)) strength += 10;
        
        strengthMeter.style.width = strength + '%';
        strengthMeter.className = 'strength-bar';
        
        if (strength < 40) {
            strengthMeter.classList.add('weak');
        } else if (strength < 70) {
            strengthMeter.classList.add('medium');
        } else {
            strengthMeter.classList.add('strong');
        }
    },
    
    initCharts: function() {
        // Inicializar gráficos si existe Chart.js
        if (typeof Chart === 'undefined') return;
        
        const charts = document.querySelectorAll('[data-chart]');
        charts.forEach(canvas => {
            const chartData = canvas.dataset.chart;
            if (chartData) {
                this.createChart(canvas, JSON.parse(chartData));
            }
        });
    },
    
    createChart: function(canvas, data) {
        const ctx = canvas.getContext('2d');
        const type = canvas.dataset.chartType || 'line';
        
        // Configuración por defecto
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        };
        
        new Chart(ctx, {
            type: type,
            data: data,
            options: defaultOptions
        });
    },
    
    // ===== EVENT LISTENERS =====
    setupEventListeners: function() {
        // Cerrar alertas automáticamente
        document.querySelectorAll('.alert-dismissible').forEach(alert => {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        });
        
        // Botón de logout
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Toggle de tema
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                openModals.forEach(modal => {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        bootstrap.Modal.getInstance(modal)?.hide();
                    }
                });
            }
        });
        
        // Lazy loading de imágenes
        this.initLazyLoading();
    },
    
    initLazyLoading: function() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    },
    
    // ===== FUNCIONES DE UTILIDAD =====
    formatDate: function(date) {
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return d.toLocaleDateString(this.state.language, options);
    },
    
    formatNumber: function(number) {
        return new Intl.NumberFormat(this.state.language).format(number);
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // ===== ANIMACIONES =====
    animateElement: function(element, animation, callback) {
        element.classList.add('animate-' + animation);
        
        const handleAnimationEnd = () => {
            element.classList.remove('animate-' + animation);
            element.removeEventListener('animationend', handleAnimationEnd);
            if (callback) callback();
        };
        
        element.addEventListener('animationend', handleAnimationEnd);
    },
    
    scrollToElement: function(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },
    
    // ===== COPIAR AL PORTAPAPELES =====
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.showNotification('Texto copiado al portapapeles', 'success');
                })
                .catch(() => {
                    this.showNotification('Error al copiar', 'error');
                });
        } else {
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('Texto copiado al portapapeles', 'success');
        }
    },
    
    // ===== DESCARGA DE ARCHIVOS =====
    downloadFile: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type: type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },
    
    // ===== DETECCIÓN DE DISPOSITIVOS =====
    isMobile: function() {
        return window.innerWidth <= 768;
    },
    
    isTablet: function() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    isDesktop: function() {
        return window.innerWidth > 1024;
    },
    
    // ===== MANEJO DE ERRORES =====
    handleError: function(error, context = 'general') {
        console.error(`Error en ${context}:`, error);
        
        if (this.config.debug) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } else {
            // En producción, mostrar mensaje genérico
            this.showNotification('Ha ocurrido un error. Por favor intenta de nuevo.', 'error');
        }
        
        // Aquí podrías enviar el error a un servicio de logging
        this.logError(error, context);
    },
    
    logError: function(error, context) {
        // Enviar error al servidor si es necesario
        if (this.config.debug) return;
        
        const errorData = {
            message: error.message,
            stack: error.stack,
            context: context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        // Enviar al servidor
        this.apiRequest('/log/error', 'POST', errorData).catch(() => {});
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// ===== EXPORTAR PARA USO GLOBAL =====
window.App = App;

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado:', registration.scope);
            })
            .catch(error => {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}

// ===== ANALÍTICAS =====
if (!App.config.debug) {
    // Aquí puedes inicializar Google Analytics u otras herramientas
    console.log('Modo producción - Analíticas activadas');
}

// ===== MODO OFFLINE =====
window.addEventListener('online', () => {
    App.showNotification('Conexión restablecida', 'success');
});

window.addEventListener('offline', () => {
    App.showNotification('Sin conexión a internet', 'warning');
});

// ===== RESIZE HANDLER =====
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Emitir evento de resize con la información del dispositivo
        document.dispatchEvent(new CustomEvent('deviceChanged', {
            detail: {
                isMobile: App.isMobile(),
                isTablet: App.isTablet(),
                isDesktop: App.isDesktop(),
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
    }, 250);
});

// ===== SCROLL HANDLER =====
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        // Detectar scroll hasta el final
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
            document.dispatchEvent(new CustomEvent('nearBottom'));
        }
        
        // Detectar scroll hasta arriba
        if (window.scrollY < 100) {
            document.dispatchEvent(new CustomEvent('nearTop'));
        }
    }, 100);
});

// ===== ESTILOS DINÁMICOS =====
const style = document.createElement('style');
style.textContent = `
    .global-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
    }
    
    .dark-theme .global-loader {
        background: rgba(0, 0, 0, 0.8);
    }
    
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9998;
        max-width: 350px;
    }
    
    .notification {
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
    }
    
    .dark-theme .notification {
        background: #1e1e2f;
        color: white;
    }
    
    .notification-success {
        border-left: 4px solid #4caf50;
    }
    
    .notification-error {
        border-left: 4px solid #f44336;
    }
    
    .notification-warning {
        border-left: 4px solid #ff9800;
    }
    
    .notification-info {
        border-left: 4px solid #00acc1;
    }
    
    .notification-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-success .notification-icon {
        background: #4caf50;
        color: white;
    }
    
    .notification-error .notification-icon {
        background: #f44336;
        color: white;
    }
    
    .notification-warning .notification-icon {
        background: #ff9800;
        color: white;
    }
    
    .notification-info .notification-icon {
        background: #00acc1;
        color: white;
    }
    
    .notification-content {
        flex: 1;
        font-size: 14px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 4px;
        transition: color 0.3s;
    }
    
    .notification-close:hover {
        color: #666;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .animate-slide-out {
        animation: slideOut 0.3s ease forwards;
    }
    
    .input-error {
        color: #f44336;
        font-size: 12px;
        margin-top: 4px;
    }
    
    .strength-bar {
        height: 4px;
        transition: width 0.3s ease, background-color 0.3s ease;
    }
    
    .strength-bar.weak {
        background: #f44336;
    }
    
    .strength-bar.medium {
        background: #ff9800;
    }
    
    .strength-bar.strong {
        background: #4caf50;
    }
`;

document.head.appendChild(style);
