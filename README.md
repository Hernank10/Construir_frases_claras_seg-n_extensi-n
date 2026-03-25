# 📝 Escritor de Frases Claras

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3.2-green.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-blue.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**Aprende a construir frases claras en español e inglés siguiendo la regla del complemento más corto primero**

[Características](#-características) •
[Instalación](#-instalación) •
[Uso](#-uso) •
[Tecnologías](#-tecnologías) •
[Contribuir](#-contribuir) •
[Licencia](#-licencia)

</div>

---

## 📖 ¿Qué es Escritor de Frases Claras?

Es una aplicación web educativa diseñada para enseñar una regla fundamental de la sintaxis en español e inglés:

> **SUJETO + VERBO + COMPLEMENTO INDIRECTO (corto) + COMPLEMENTO DIRECTO (largo)**

Cuando el complemento indirecto (A QUIÉN) es más corto que el complemento directo (QUÉ), debe colocarse primero para lograr mayor claridad y fluidez.

### 📚 Ejemplo

| ❌ Incorrecto | ✅ Correcto |
|--------------|------------|
| El profesor explicó *los conceptos complejos de física cuántica* **a los estudiantes** | El profesor explicó **a los estudiantes** *los conceptos complejos de física cuántica* |

---

## ✨ Características

### 🎯 Contenido Educativo
- **100 ejercicios** de práctica con frases en español e inglés
- **100 flashcards** con sistema de repetición espaciada (SRS)
- **3 modos de práctica**: ordenar componentes, traducción y reescritura
- **10 categorías temáticas**: educación, salud, negocios, viajes, tecnología, etc.
- **3 niveles de dificultad**: fácil, intermedio, avanzado

### 🎮 Gamificación
- **Sistema de puntos**: +10 por acierto, -5 por error
- **Rachas**: Contador de días consecutivos practicando
- **Logros**: 10 logros desbloqueables
- **Niveles**: Progresión basada en experiencia acumulada

### 📊 Seguimiento de Progreso
- **Dashboard interactivo** con estadísticas en tiempo real
- **Gráficos** de progreso semanal
- **Historial detallado** de prácticas
- **Precisión por tipo** de ejercicio

### 👤 Perfil de Usuario
- Avatar personalizable
- Edición de información personal
- Preferencias de idioma y notificaciones
- Gestión de sesiones activas
- Cambio de contraseña

### 🛠️ Creador de Ejercicios
- Creación individual de ejercicios
- Generación masiva aleatoria
- Importación desde JSON
- Plantillas predefinidas por categoría
- Exportación de ejercicios

### 📝 Sistema de Exámenes
- Configuración personalizada (número de preguntas, dificultad, categoría)
- Temporizador con cuenta regresiva
- Marcadores para preguntas dudosas
- Resultados detallados con estadísticas

---

## 🚀 Instalación

### Requisitos Previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Git (opcional, para clonar el repositorio)

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Hernank10/Construir_frases_claras_seg-n_extensi-n.git
cd Construir_frases_claras_seg-n_extensi-n

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Inicializar la base de datos
python init_db.py

# 5. Ejecutar la aplicación
python run.py



# Construir Frases Claras según Extensión

Aplicación educativa para aprender a construir frases en español e inglés siguiendo la regla:  
**QUIÉN + VERBO + A QUIÉN (corto) + QUÉ (largo)**.

## Características

- 📝 **Práctica de orden de componentes** (modo interactivo con botones)
- 🔤 **Traducción español-inglés** con verificación flexible
- 🃏 **Sistema de flashcards** con repetición espaciada (SRS)
- 📊 **Dashboard** con estadísticas de progreso
- 📚 **Exámenes** configurables con temporizador
- ✍️ **Creador de ejercicios** propio (guardar en JSON/localStorage)
- 👤 **Perfil de usuario** con avatar, nivel, logros y sesiones activas
- 🌓 **Modo oscuro** automático según preferencias del sistema
- 📱 **Diseño responsive** para móviles y tablets

## Tecnologías utilizadas

- **Backend**: Flask (Python)
- **Base de datos**: SQLite con SQLAlchemy
- **Frontend**: HTML, CSS, Bootstrap 5, JavaScript vanilla
- **Gráficos**: Chart.js
- **Almacenamiento**: localStorage, sessionStorage

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/construir-frases-claras.git
   cd construir-frases-claras
