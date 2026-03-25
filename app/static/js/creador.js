/* ============================================
   CREADOR DE EJERCICIOS - ESCRITOR DE FRASES CLARAS
   ============================================ */

// ===== OBJETO PRINCIPAL DEL CREADOR =====
const Creador = {
    // Configuración específica
    config: {
        maxExercises: 1000,
        defaultCategory: 'general',
        defaultDifficulty: 'intermediate',
        supportedTypes: ['order', 'translation', 'rewrite'],
        batchModes: ['random', 'pattern', 'template'],
        previewModes: ['grid', 'list', 'json'],
        autoSaveInterval: 30000 // 30 segundos
    },

    // Estado del creador
    state: {
        exercises: [],
        nextId: 1,
        currentTab: 'single',
        selectedTemplate: null,
        previewMode: 'grid',
        isLoading: false,
        autoSaveTimer: null,
        categories: ['educación', 'salud', 'tecnología', 'negocios', 'gobierno', 'social', 'cultura'],
        difficulties: ['easy', 'intermediate', 'advanced'],
        templates: {
            education: [],
            business: [],
            health: [],
            travel: [],
            technology: [],
            daily: []
        }
    },

    // ===== INICIALIZACIÓN =====
    init: function() {
        console.log('Creador de ejercicios iniciado');

        // Cargar datos guardados
        this.loadExercises();
        this.loadCategories();
        this.loadTemplates();

        // Inicializar componentes
        this.initTabs();
        this.initEventListeners();
        this.initAutoSave();

        // Actualizar UI
        this.updateStats();
        this.updateExercisesList();
    },

    // ===== CARGA DE DATOS =====
    loadExercises: function() {
        const saved = localStorage.getItem('creator_exercises');
        if (saved) {
            try {
                this.state.exercises = JSON.parse(saved);
                this.state.nextId = this.state.exercises.length > 0 
                    ? Math.max(...this.state.exercises.map(e => e.id)) + 1 
                    : 1;
            } catch (e) {
                console.error('Error cargando ejercicios:', e);
                this.state.exercises = [];
                this.state.nextId = 1;
            }
        }
    },

    saveExercises: function() {
        localStorage.setItem('creator_exercises', JSON.stringify(this.state.exercises));
        this.updateStats();
        this.updateExercisesList();
        this.updatePreview();
    },

    loadCategories: function() {
        const datalist = document.getElementById('categoryList');
        if (datalist) {
            datalist.innerHTML = this.state.categories.map(c => 
                `<option value="${c}">`
            ).join('');
        }
    },

    loadTemplates: function() {
        // Templates predefinidos (podrían venir de un JSON externo)
        this.state.templates = {
            education: [
                { subject: 'El profesor', verb: 'explicó', recipient: 'a los estudiantes', object: 'los conceptos complejos', category: 'educación', difficulty: 'intermediate' },
                { subject: 'La universidad', verb: 'ofreció', recipient: 'a los becarios', object: 'programas de intercambio', category: 'educación', difficulty: 'easy' },
                { subject: 'El alumno', verb: 'entregó', recipient: 'al profesor', object: 'la tarea de historia', category: 'educación', difficulty: 'easy' }
            ],
            business: [
                { subject: 'La empresa', verb: 'envió', recipient: 'a sus clientes', object: 'un boletín informativo', category: 'negocios', difficulty: 'easy' },
                { subject: 'El gerente', verb: 'presentó', recipient: 'a los inversionistas', object: 'los resultados trimestrales', category: 'negocios', difficulty: 'intermediate' }
            ],
            health: [
                { subject: 'El médico', verb: 'recetó', recipient: 'a los pacientes', object: 'medicamentos genéricos', category: 'salud', difficulty: 'intermediate' },
                { subject: 'La enfermera', verb: 'explicó', recipient: 'a la familia', object: 'los cuidados postoperatorios', category: 'salud', difficulty: 'advanced' }
            ],
            travel: [
                { subject: 'El guía', verb: 'mostró', recipient: 'a los turistas', object: 'los monumentos históricos', category: 'viajes', difficulty: 'easy' },
                { subject: 'La agencia', verb: 'ofreció', recipient: 'a los viajeros', object: 'paquetes todo incluido', category: 'viajes', difficulty: 'easy' }
            ],
            technology: [
                { subject: 'El ingeniero', verb: 'explicó', recipient: 'a los técnicos', object: 'el nuevo sistema', category: 'tecnología', difficulty: 'intermediate' },
                { subject: 'La empresa', verb: 'lanzó', recipient: 'a los desarrolladores', object: 'una API gratuita', category: 'tecnología', difficulty: 'advanced' }
            ],
            daily: [
                { subject: 'Mi hermana', verb: 'prestó', recipient: 'a su amiga', object: 'un libro de recetas', category: 'vida diaria', difficulty: 'easy' },
                { subject: 'El vecino', verb: 'regaló', recipient: 'a los niños', object: 'dulces de su viaje', category: 'vida diaria', difficulty: 'easy' }
            ]
        };
    },

    // ===== GESTIÓN DE PESTAÑAS =====
    initTabs: function() {
        const tabs = document.querySelectorAll('.creator-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = tab.dataset.bsTarget || tab.getAttribute('href');
                if (target) {
                    this.switchTab(target.replace('#', ''));
                }
            });
        });
    },

    switchTab: function(tabId) {
        this.state.currentTab = tabId;
        
        // Actualizar clases activas
        document.querySelectorAll('.creator-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.bsTarget === `#${tabId}` || t.getAttribute('href') === `#${tabId}`);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('show', pane.id === tabId);
            pane.classList.toggle('active', pane.id === tabId);
        });

        // Acciones específicas por pestaña
        if (tabId === 'preview') {
            this.updatePreview();
        }
    },

    // ===== CREACIÓN INDIVIDUAL =====
    addExercise: function() {
        const exercise = {
            id: parseInt(document.getElementById('exerciseId').value) || this.state.nextId,
            type: document.getElementById('exerciseType').value,
            spanish: document.getElementById('spanishText').value.trim(),
            english: document.getElementById('englishText').value.trim(),
            components: [
                document.getElementById('componentQuien').value.trim(),
                document.getElementById('componentVerbo').value.trim(),
                document.getElementById('componentAQuien').value.trim(),
                document.getElementById('componentQue').value.trim()
            ],
            category: document.getElementById('category').value.trim() || this.config.defaultCategory,
            difficulty: document.getElementById('difficulty').value,
            hint: document.getElementById('hint').value.trim(),
            tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        // Validaciones
        if (!exercise.spanish || !exercise.english || exercise.components.some(c => !c)) {
            App.showNotification('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        // Verificar ID único
        if (this.state.exercises.some(e => e.id === exercise.id)) {
            App.showNotification('Ya existe un ejercicio con ese ID', 'error');
            return;
        }

        this.state.exercises.push(exercise);
        this.state.nextId = Math.max(this.state.nextId, exercise.id + 1);
        
        this.saveExercises();
        this.clearForm();
        App.showNotification('Ejercicio agregado correctamente', 'success');

        // Cambiar a pestaña de vista previa
        this.switchTab('preview');
    },

    clearForm: function() {
        document.getElementById('exerciseId').value = this.state.nextId;
        document.getElementById('spanishText').value = '';
        document.getElementById('englishText').value = '';
        document.getElementById('componentQuien').value = '';
        document.getElementById('componentVerbo').value = '';
        document.getElementById('componentAQuien').value = '';
        document.getElementById('componentQue').value = '';
        document.getElementById('category').value = '';
        document.getElementById('hint').value = '';
        document.getElementById('tags').value = '';
    },

    // ===== EDICIÓN Y ELIMINACIÓN =====
    editExercise: function(id) {
        const exercise = this.state.exercises.find(e => e.id === id);
        if (!exercise) return;

        document.getElementById('exerciseId').value = exercise.id;
        document.getElementById('exerciseType').value = exercise.type;
        document.getElementById('spanishText').value = exercise.spanish;
        document.getElementById('englishText').value = exercise.english;
        document.getElementById('componentQuien').value = exercise.components[0];
        document.getElementById('componentVerbo').value = exercise.components[1];
        document.getElementById('componentAQuien').value = exercise.components[2];
        document.getElementById('componentQue').value = exercise.components[3];
        document.getElementById('category').value = exercise.category;
        document.getElementById('difficulty').value = exercise.difficulty;
        document.getElementById('hint').value = exercise.hint || '';
        document.getElementById('tags').value = exercise.tags ? exercise.tags.join(', ') : '';

        this.switchTab('single');
        App.showNotification('Cargando ejercicio para editar', 'info');
    },

    deleteExercise: function(id) {
        if (!confirm('¿Está seguro de eliminar este ejercicio?')) return;

        this.state.exercises = this.state.exercises.filter(e => e.id !== id);
        this.saveExercises();
        App.showNotification('Ejercicio eliminado', 'warning');
    },

    deleteAll: function() {
        if (!confirm('¿Está seguro de eliminar TODOS los ejercicios? Esta acción no se puede deshacer.')) return;

        this.state.exercises = [];
        this.state.nextId = 1;
        this.saveExercises();
        App.showNotification('Todos los ejercicios han sido eliminados', 'warning');
    },

    // ===== CREACIÓN MASIVA =====
    generateBatch: function() {
        const count = parseInt(document.getElementById('batchCount').value);
        const mode = document.getElementById('batchMode').value;

        if (count < 1 || count > this.config.maxExercises) {
            App.showNotification(`La cantidad debe estar entre 1 y ${this.config.maxExercises}`, 'warning');
            return;
        }

        const newExercises = [];

        for (let i = 0; i < count; i++) {
            let exercise;

            switch(mode) {
                case 'random':
                    exercise = this.generateRandomExercise();
                    break;
                case 'pattern':
                    exercise = this.generateFromPattern();
                    break;
                case 'template':
                    exercise = this.generateFromTemplate();
                    break;
                default:
                    exercise = this.generateRandomExercise();
            }

            if (exercise) {
                exercise.id = this.state.nextId++;
                newExercises.push(exercise);
            }
        }

        this.state.exercises = [...this.state.exercises, ...newExercises];
        this.saveExercises();
        App.showNotification(`${newExercises.length} ejercicios generados correctamente`, 'success');
    },

    generateRandomExercise: function() {
        const subjects = ['El profesor', 'La doctora', 'El ingeniero', 'La empresa', 'El gobierno', 'La organización', 'El artista', 'El científico'];
        const verbs = ['explicó', 'enseñó', 'mostró', 'entregó', 'envió', 'ofreció', 'dedicó', 'presentó'];
        const recipients = ['a los estudiantes', 'a los pacientes', 'a los clientes', 'a los trabajadores', 'a la comunidad', 'a los usuarios', 'al público'];
        const objects = [
            'los conceptos complejos', 'el nuevo tratamiento', 'los resultados del estudio',
            'un paquete de beneficios', 'las políticas actualizadas', 'material educativo',
            'una colección de arte', 'su último trabajo'
        ];
        const categories = this.state.categories;
        const difficulties = this.state.difficulties;

        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const recipient = recipients[Math.floor(Math.random() * recipients.length)];
        const object = objects[Math.floor(Math.random() * objects.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        const spanish = `${subject} ${verb} ${recipient} ${object}`;
        // Traducción aproximada (podría mejorarse)
        const english = `${subject} ${verb} ${recipient} ${object}`;

        return {
            type: 'order',
            spanish: spanish,
            english: english,
            components: [subject, verb, recipient, object],
            category: category,
            difficulty: difficulty,
            hint: `Ordena: ${subject} + ${verb} + ${recipient} + ${object}`,
            tags: [category, 'generado']
        };
    },

    generateFromPattern: function() {
        // Implementar patrones personalizados
        const patterns = document.getElementById('batchPatterns').value.split('\n').filter(p => p.trim());
        if (patterns.length === 0) return this.generateRandomExercise();

        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        // Aquí se podría parsear el patrón, pero por simplicidad generamos aleatorio
        return this.generateRandomExercise();
    },

    generateFromTemplate: function() {
        const templateCategories = Object.keys(this.state.templates);
        const category = templateCategories[Math.floor(Math.random() * templateCategories.length)];
        const templates = this.state.templates[category];
        if (templates.length === 0) return this.generateRandomExercise();

        const tpl = templates[Math.floor(Math.random() * templates.length)];
        return {
            type: 'order',
            spanish: `${tpl.subject} ${tpl.verb} ${tpl.recipient} ${tpl.object}`,
            english: `${tpl.subject} ${tpl.verb} ${tpl.recipient} ${tpl.object}`,
            components: [tpl.subject, tpl.verb, tpl.recipient, tpl.object],
            category: tpl.category,
            difficulty: tpl.difficulty,
            hint: `Orden: ${tpl.subject} + ${tpl.verb} + ${tpl.recipient} + ${tpl.object}`,
            tags: [tpl.category, 'plantilla']
        };
    },

    // ===== IMPORTACIÓN =====
    importJson: function() {
        const jsonText = document.getElementById('importJson').value.trim();
        if (!jsonText) {
            App.showNotification('Por favor ingrese JSON', 'warning');
            return;
        }

        try {
            const imported = JSON.parse(jsonText);
            if (!Array.isArray(imported)) {
                App.showNotification('El JSON debe ser un array de ejercicios', 'error');
                return;
            }

            let added = 0;
            imported.forEach(item => {
                if (item.spanish && item.english && Array.isArray(item.components) && item.components.length === 4) {
                    // Asignar nuevo ID si es necesario
                    item.id = this.state.nextId++;
                    this.state.exercises.push(item);
                    added++;
                }
            });

            this.saveExercises();
            App.showNotification(`${added} ejercicios importados correctamente`, 'success');
        } catch (e) {
            App.showNotification('JSON inválido: ' + e.message, 'error');
        }
    },

    importFromFile: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error('El archivo debe contener un array');

                let added = 0;
                imported.forEach(item => {
                    if (item.spanish && item.english && Array.isArray(item.components) && item.components.length === 4) {
                        item.id = this.state.nextId++;
                        this.state.exercises.push(item);
                        added++;
                    }
                });

                this.saveExercises();
                App.showNotification(`${added} ejercicios importados desde archivo`, 'success');
            } catch (e) {
                App.showNotification('Error al leer el archivo: ' + e.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    validateJson: function() {
        const jsonText = document.getElementById('importJson').value.trim();
        if (!jsonText) {
            App.showNotification('Ingrese JSON para validar', 'warning');
            return;
        }

        try {
            JSON.parse(jsonText);
            App.showNotification('JSON válido', 'success');
        } catch (e) {
            App.showNotification('JSON inválido: ' + e.message, 'error');
        }
    },

    // ===== PLANTILLAS =====
    loadTemplate: function(templateName) {
        const templates = this.state.templates[templateName];
        if (!templates || templates.length === 0) {
            App.showNotification('Plantilla no encontrada', 'warning');
            return;
        }

        templates.forEach(tpl => {
            const exercise = {
                id: this.state.nextId++,
                type: 'order',
                spanish: `${tpl.subject} ${tpl.verb} ${tpl.recipient} ${tpl.object}`,
                english: `${tpl.subject} ${tpl.verb} ${tpl.recipient} ${tpl.object}`,
                components: [tpl.subject, tpl.verb, tpl.recipient, tpl.object],
                category: tpl.category,
                difficulty: tpl.difficulty,
                hint: `Ordena: ${tpl.subject} + ${tpl.verb} + ${tpl.recipient} + ${tpl.object}`,
                tags: [tpl.category, 'plantilla']
            };
            this.state.exercises.push(exercise);
        });

        this.saveExercises();
        App.showNotification(`Plantilla "${templateName}" cargada (${templates.length} ejercicios)`, 'success');
    },

    // ===== VISTA PREVIA =====
    setPreviewMode: function(mode) {
        this.state.previewMode = mode;
        document.querySelectorAll('.preview-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        this.updatePreview();
    },

    updatePreview: function() {
        const container = document.getElementById('previewContainer');
        if (!container) return;

        const exercises = this.state.exercises;

        if (exercises.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay ejercicios para mostrar</p>';
            return;
        }

        switch(this.state.previewMode) {
            case 'grid':
                this.showGridPreview(container, exercises);
                break;
            case 'list':
                this.showListPreview(container, exercises);
                break;
            case 'json':
                this.showJsonPreview(container, exercises);
                break;
        }
    },

    showGridPreview: function(container, exercises) {
        const html = exercises.slice(0, 12).map(ex => `
            <div class="col-md-4 mb-3">
                <div class="card preview-card">
                    <div class="card-body">
                        <h6 class="card-title">ID: ${ex.id}</h6>
                        <p class="small"><strong>ES:</strong> ${ex.spanish.substring(0, 50)}${ex.spanish.length > 50 ? '...' : ''}</p>
                        <p class="small"><strong>EN:</strong> ${ex.english.substring(0, 50)}${ex.english.length > 50 ? '...' : ''}</p>
                        <div class="d-flex justify-content-between">
                            <span class="badge bg-primary">${ex.category}</span>
                            <span class="badge bg-${ex.difficulty === 'easy' ? 'success' : ex.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                                ${ex.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `<div class="row">${html}</div>`;
    },

    showListPreview: function(container, exercises) {
        const html = exercises.map(ex => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${ex.spanish}</strong><br>
                        <small class="text-muted">${ex.english}</small>
                    </div>
                    <div>
                        <span class="badge bg-primary me-1">${ex.category}</span>
                        <span class="badge bg-${ex.difficulty === 'easy' ? 'success' : ex.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                            ${ex.difficulty}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `<div class="list-group">${html}</div>`;
    },

    showJsonPreview: function(container, exercises) {
        const jsonStr = JSON.stringify(exercises, null, 2);
        container.innerHTML = `<pre class="bg-light p-3 rounded"><code>${jsonStr}</code></pre>`;
    },

    // ===== LISTA DE EJERCICIOS =====
    updateExercisesList: function() {
        const tbody = document.getElementById('exercisesBody');
        if (!tbody) return;

        if (this.state.exercises.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>No hay ejercicios creados aún</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.state.exercises.map(ex => `
            <tr>
                <td>${ex.id}</td>
                <td>${ex.spanish.substring(0, 30)}${ex.spanish.length > 30 ? '...' : ''}</td>
                <td>${ex.english.substring(0, 30)}${ex.english.length > 30 ? '...' : ''}</td>
                <td><span class="badge bg-primary">${ex.category}</span></td>
                <td>
                    <span class="badge bg-${ex.difficulty === 'easy' ? 'success' : ex.difficulty === 'intermediate' ? 'warning' : 'danger'}">
                        ${ex.difficulty}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="Creador.showComponents(${ex.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-warning" onclick="Creador.editExercise(${ex.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="Creador.deleteExercise(${ex.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    showComponents: function(id) {
        const exercise = this.state.exercises.find(e => e.id === id);
        if (!exercise) return;

        App.showNotification(
            `Componentes: ${exercise.components.join(' → ')}`,
            'info',
            5000
        );
    },

    // ===== ESTADÍSTICAS =====
    updateStats: function() {
        document.getElementById('exerciseCounter').textContent = 
            `${this.state.exercises.length}/${this.config.maxExercises}`;
        document.getElementById('savedCount').textContent = this.state.exercises.length;

        const categories = new Set(this.state.exercises.map(e => e.category));
        document.getElementById('categoryCount').textContent = categories.size;

        // Otros stats si existen
    },

    // ===== AUTO-SAVE =====
    initAutoSave: function() {
        this.state.autoSaveTimer = setInterval(() => {
            this.saveExercises();
            console.log('Auto-save realizado');
        }, this.config.autoSaveInterval);
    },

    // ===== EXPORTACIÓN =====
    exportJson: function() {
        const dataStr = JSON.stringify(this.state.exercises, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ejercicios_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    saveToDatabase: function() {
        this.setState('isLoading', true);

        App.apiRequest('/exercises/save', 'POST', { exercises: this.state.exercises })
            .then(() => {
                App.showNotification('Ejercicios guardados en la base de datos', 'success');
            })
            .catch(error => {
                App.showNotification('Error al guardar en la base de datos', 'error');
                console.error(error);
            })
            .finally(() => {
                this.setState('isLoading', false);
            });
    },

    // ===== UTILIDADES =====
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
        // Botones de acción principal
        document.getElementById('add-exercise-btn')?.addEventListener('click', () => this.addExercise());
        document.getElementById('clear-form-btn')?.addEventListener('click', () => this.clearForm());
        document.getElementById('generate-batch-btn')?.addEventListener('click', () => this.generateBatch());
        document.getElementById('import-json-btn')?.addEventListener('click', () => this.importJson());
        document.getElementById('validate-json-btn')?.addEventListener('click', () => this.validateJson());
        document.getElementById('export-json-btn')?.addEventListener('click', () => this.exportJson());
        document.getElementById('save-db-btn')?.addEventListener('click', () => this.saveToDatabase());
        document.getElementById('delete-all-btn')?.addEventListener('click', () => this.deleteAll());

        // Selector de archivo JSON
        document.getElementById('jsonFile')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromFile(e.target.files[0]);
                e.target.value = ''; // Reset para permitir mismo archivo
            }
        });

        // Botones de modo de vista previa
        document.querySelectorAll('.preview-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setPreviewMode(e.target.dataset.mode);
            });
        });

        // Tarjetas de plantillas
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const template = card.dataset.template || card.querySelector('h5')?.textContent.toLowerCase();
                if (template) {
                    this.loadTemplate(template);
                }
            });
        });

        // Validación de campos en creación individual
        document.getElementById('spanishText')?.addEventListener('input', () => this.validateForm());
        document.getElementById('englishText')?.addEventListener('input', () => this.validateForm());
    },

    validateForm: function() {
        // Validación simple
        const spanish = document.getElementById('spanishText').value.trim();
        const english = document.getElementById('englishText').value.trim();
        const quien = document.getElementById('componentQuien').value.trim();
        const verbo = document.getElementById('componentVerbo').value.trim();
        const aQuien = document.getElementById('componentAQuien').value.trim();
        const que = document.getElementById('componentQue').value.trim();

        const isValid = spanish && english && quien && verbo && aQuien && que;
        document.getElementById('add-exercise-btn').disabled = !isValid;
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('creator-container')) {
        Creador.init();
    }
});

// ===== EXPORTAR =====
window.Creador = Creador;
