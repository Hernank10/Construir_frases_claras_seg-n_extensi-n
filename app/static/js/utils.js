/* ============================================
   UTILIDADES - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO DE UTILIDADES =====
const Utils = {
    // ===== FORMATEO =====
    formatDate: function(date, format = 'short') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Fecha inválida';

        const options = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            medium: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };

        return d.toLocaleDateString('es-ES', options[format] || options.short);
    },

    formatTime: function(seconds) {
        if (seconds < 60) return `${seconds} seg`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) return `${minutes} min ${remainingSeconds} seg`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    },

    formatNumber: function(num, decimals = 0) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    },

    formatCurrency: function(amount, currency = 'EUR') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    truncate: function(text, length = 50, suffix = '...') {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    },

    capitalize: function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    // ===== VALIDACIÓN =====
    isEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    isURL: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    isPhone: function(phone) {
        const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        return re.test(phone);
    },

    isStrongPassword: function(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9]/.test(password)
        };
        const score = Object.values(checks).filter(Boolean).length;
        return {
            isValid: score >= 4,
            score: score,
            checks: checks
        };
    },

    // ===== MANIPULACIÓN DE STRINGS =====
    slugify: function(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    },

    randomString: function(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // ===== MANEJO DE ARRAYS =====
    shuffle: function(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    groupBy: function(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    unique: function(array) {
        return [...new Set(array)];
    },

    // ===== MANEJO DE OBJETOS =====
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    merge: function(target, ...sources) {
        return Object.assign({}, target, ...sources);
    },

    pick: function(obj, keys) {
        return keys.reduce((result, key) => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
            return result;
        }, {});
    },

    omit: function(obj, keys) {
        return Object.keys(obj)
            .filter(key => !keys.includes(key))
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
    },

    // ===== ALMACENAMIENTO LOCAL =====
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage', e);
                return false;
            }
        },
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage', e);
                return defaultValue;
            }
        },
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage', e);
                return false;
            }
        },
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage', e);
                return false;
            }
        }
    },

    // ===== COOKIES =====
    cookies: {
        set: function(name, value, days = 7) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
        },
        get: function(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        },
        remove: function(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        }
    },

    // ===== DETECCIÓN DE DISPOSITIVO =====
    device: {
        isMobile: function() {
            return window.innerWidth <= 768;
        },
        isTablet: function() {
            return window.innerWidth > 768 && window.innerWidth <= 1024;
        },
        isDesktop: function() {
            return window.innerWidth > 1024;
        },
        getOS: function() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Windows')) return 'Windows';
            if (userAgent.includes('Mac')) return 'MacOS';
            if (userAgent.includes('Linux')) return 'Linux';
            if (userAgent.includes('Android')) return 'Android';
            if (userAgent.includes('iOS')) return 'iOS';
            return 'Unknown';
        },
        getBrowser: function() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Chrome')) return 'Chrome';
            if (userAgent.includes('Firefox')) return 'Firefox';
            if (userAgent.includes('Safari')) return 'Safari';
            if (userAgent.includes('Edge')) return 'Edge';
            if (userAgent.includes('Opera')) return 'Opera';
            return 'Unknown';
        }
    },

    // ===== EVENTOS =====
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
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

    // ===== DOM =====
    dom: {
        createElement: function(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'class') {
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.slice(2), value);
                } else {
                    element.setAttribute(key, value);
                }
            });
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },

        removeElement: function(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        },

        toggleClass: function(element, className) {
            if (element) {
                element.classList.toggle(className);
            }
        },

        hasClass: function(element, className) {
            return element && element.classList.contains(className);
        }
    },

    // ===== MANEJO DE ERRORES =====
    error: {
        log: function(error, context = '') {
            console.error(`[${context}]`, error);
            // Aquí podrías enviar a un servicio de logging como Sentry
        },

        create: function(message, code = 500) {
            const error = new Error(message);
            error.code = code;
            return error;
        }
    },

    // ===== MATEMÁTICAS =====
    math: {
        clamp: function(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },
        randomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        randomFloat: function(min, max) {
            return Math.random() * (max - min) + min;
        },
        round: function(value, decimals = 0) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        },
        sum: function(array) {
            return array.reduce((a, b) => a + b, 0);
        },
        average: function(array) {
            return array.length ? this.sum(array) / array.length : 0;
        }
    },

    // ===== COLORES =====
    color: {
        hexToRgb: function(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        rgbToHex: function(r, g, b) {
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        },
        randomColor: function() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
    },

    // ===== TIEMPO =====
    time: {
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        timer: function(seconds, callback) {
            let remaining = seconds;
            const interval = setInterval(() => {
                remaining--;
                callback(remaining);
                if (remaining <= 0) {
                    clearInterval(interval);
                }
            }, 1000);
            return interval;
        }
    },

    // ===== URL =====
    url: {
        getParams: function() {
            const params = new URLSearchParams(window.location.search);
            const result = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            return result;
        },
        setParams: function(params) {
            const url = new URL(window.location);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
            window.history.pushState({}, '', url);
        },
        removeParams: function(keys) {
            const url = new URL(window.location);
            keys.forEach(key => url.searchParams.delete(key));
            window.history.pushState({}, '', url);
        }
    },

    // ===== DESCARGA DE ARCHIVOS =====
    download: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    // ===== COPIAR AL PORTAPAPELES =====
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },

    // ===== COMPARACIÓN =====
    compare: {
        strings: function(a, b, caseSensitive = false) {
            if (!caseSensitive) {
                a = a.toLowerCase();
                b = b.toLowerCase();
            }
            return a.localeCompare(b);
        },
        numbers: function(a, b) {
            return a - b;
        },
        dates: function(a, b) {
            return new Date(a) - new Date(b);
        }
    },

    // ===== TEMPLATES =====
    template: function(str, data) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    },

    // ===== OBSERVADORES =====
    observer: {
        intersection: function(elements, callback, options = {}) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback(entry.target);
                    }
                });
            }, options);

            if (Array.isArray(elements)) {
                elements.forEach(el => observer.observe(el));
            } else {
                observer.observe(elements);
            }

            return observer;
        },

        mutation: function(element, callback, options = { childList: true, subtree: true }) {
            const observer = new MutationObserver(callback);
            observer.observe(element, options);
            return observer;
        }
    }
};

// ===== EXPORTAR =====
window.Utils = Utils;
