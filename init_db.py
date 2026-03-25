#!/usr/bin/env python3
"""
Script para inicializar la base de datos del proyecto
Escritor de Frases Claras
"""

import sqlite3
import os
import json
from datetime import datetime

# Ruta de la base de datos
DB_PATH = 'instance/frases.db'

def create_tables():
    """Crear todas las tablas necesarias"""
    
    # Asegurar que el directorio instance existe
    os.makedirs('instance', exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            location TEXT,
            bio TEXT,
            avatar_url TEXT,
            country TEXT,
            phone TEXT,
            birth_date TEXT,
            website TEXT,
            ui_language TEXT DEFAULT 'es',
            practice_language TEXT DEFAULT 'es-en',
            spanish_level TEXT DEFAULT 'beginner',
            newsletter INTEGER DEFAULT 1,
            two_factor_enabled INTEGER DEFAULT 0,
            email_notifications INTEGER DEFAULT 1,
            practice_reminders INTEGER DEFAULT 1,
            achievement_alerts INTEGER DEFAULT 1,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Tabla de oraciones (ejercicios)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sentences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spanish TEXT NOT NULL,
            english TEXT NOT NULL,
            components TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            difficulty TEXT DEFAULT 'intermediate',
            hint TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de flashcards
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            category TEXT,
            subcategory TEXT,
            difficulty TEXT,
            example TEXT,
            notes TEXT,
            tags TEXT,
            times_reviewed INTEGER DEFAULT 0,
            times_correct INTEGER DEFAULT 0,
            last_reviewed TIMESTAMP,
            next_review TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de historial de práctica
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS practice_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            sentence_id INTEGER,
            flashcard_id INTEGER,
            user_answer TEXT,
            is_correct INTEGER,
            practice_type TEXT,
            score_earned INTEGER DEFAULT 0,
            time_spent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (sentence_id) REFERENCES sentences(id),
            FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)
        )
    ''')
    
    # Tabla de logros
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            rarity TEXT,
            required_type TEXT,
            required_value INTEGER,
            points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla de logros desbloqueados por usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            achievement_id INTEGER,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (achievement_id) REFERENCES achievements(id)
        )
    ''')
    
    # Tabla de sesiones activas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS active_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            token TEXT,
            device_name TEXT,
            device_type TEXT,
            location TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            is_current INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Tabla de configuración de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            daily_goal_practices INTEGER DEFAULT 10,
            daily_goal_flashcards INTEGER DEFAULT 20,
            daily_goal_minutes INTEGER DEFAULT 30,
            sound_enabled INTEGER DEFAULT 1,
            animations_enabled INTEGER DEFAULT 1,
            auto_advance INTEGER DEFAULT 1,
            show_hints INTEGER DEFAULT 1,
            theme TEXT DEFAULT 'light',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Tabla de ejercicios personalizados (creados por usuarios)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS custom_exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            spanish TEXT NOT NULL,
            english TEXT NOT NULL,
            components TEXT NOT NULL,
            category TEXT,
            difficulty TEXT,
            hint TEXT,
            tags TEXT,
            is_public INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Tabla de estadísticas diarias
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT,
            practices_count INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            flashcards_count INTEGER DEFAULT 0,
            time_spent INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, date)
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ Tablas creadas correctamente")

def load_sentences_from_json():
    """Cargar las 100 oraciones desde ejercicios.json"""
    json_path = 'app/static/data/ejercicios.json'
    
    if not os.path.exists(json_path):
        print("❌ Archivo ejercicios.json no encontrado")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar si ya hay datos
    cursor.execute("SELECT COUNT(*) FROM sentences")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"⚠️ Ya existen {count} oraciones en la base de datos")
        respuesta = input("¿Deseas recargar los datos? (s/n): ")
        if respuesta.lower() != 's':
            conn.close()
            return
        cursor.execute("DELETE FROM sentences")
        print("🗑️ Datos anteriores eliminados")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        sentences = json.load(f)
    
    for s in sentences:
        cursor.execute('''
            INSERT INTO sentences (id, spanish, english, components, category, difficulty, hint)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            s['id'],
            s['spanish'],
            s['english'],
            ','.join(s['components']),
            s['category'],
            s['difficulty'],
            s.get('hint', '')
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Cargadas {len(sentences)} oraciones en la base de datos")

def load_flashcards_from_json():
    """Cargar las 100 flashcards desde flashcards.json"""
    json_path = 'app/static/data/flashcards.json'
    
    if not os.path.exists(json_path):
        print("❌ Archivo flashcards.json no encontrado")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar si ya hay datos
    cursor.execute("SELECT COUNT(*) FROM flashcards")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"⚠️ Ya existen {count} flashcards en la base de datos")
        respuesta = input("¿Deseas recargar los datos? (s/n): ")
        if respuesta.lower() != 's':
            conn.close()
            return
        cursor.execute("DELETE FROM flashcards")
        print("🗑️ Datos anteriores eliminados")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        flashcards = json.load(f)
    
    for f in flashcards:
        cursor.execute('''
            INSERT INTO flashcards (id, front, back, category, subcategory, difficulty, example, notes, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            f['id'],
            f['front'],
            f['back'],
            f.get('category', 'general'),
            f.get('subcategory', ''),
            f.get('difficulty', 'intermediate'),
            f.get('example', ''),
            f.get('notes', ''),
            f.get('tags', '')
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Cargadas {len(flashcards)} flashcards en la base de datos")

def create_default_achievements():
    """Crear logros por defecto"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar si ya hay logros
    cursor.execute("SELECT COUNT(*) FROM achievements")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"⚠️ Ya existen {count} logros en la base de datos")
        conn.close()
        return
    
    achievements = [
        ("Primer paso", "Completa tu primera práctica", "star", "bronze", "practices", 1, 10),
        ("Aprendiz constante", "Completa 10 prácticas", "fire", "bronze", "practices", 10, 50),
        ("Maestro de frases", "Completa 100 prácticas", "crown", "gold", "practices", 100, 500),
        ("Racha de 7 días", "Practica durante 7 días seguidos", "calendar-check", "silver", "streak", 7, 100),
        ("Racha de 30 días", "Practica durante 30 días seguidos", "calendar-star", "gold", "streak", 30, 500),
        ("Perfecto", "Obtén un 100% de precisión en una práctica", "check-double", "silver", "perfect_score", 1, 100),
        ("Traductor", "Completa 10 traducciones correctas", "language", "bronze", "translations", 10, 50),
        ("Flashcard master", "Estudia 100 flashcards", "layer-group", "silver", "flashcards", 100, 200),
        ("Examinador", "Completa 5 exámenes", "clipboard-list", "bronze", "exams", 5, 100),
        ("Creador", "Crea 10 ejercicios personalizados", "plus-circle", "silver", "custom_exercises", 10, 100)
    ]
    
    for ach in achievements:
        cursor.execute('''
            INSERT INTO achievements (name, description, icon, rarity, required_type, required_value, points)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ach)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Creados {len(achievements)} logros por defecto")

def main():
    print("=" * 50)
    print("📚 INICIALIZACIÓN DE BASE DE DATOS")
    print("=" * 50)
    
    # Crear tablas
    create_tables()
    
    # Cargar oraciones
    print("\n📖 Cargando oraciones...")
    load_sentences_from_json()
    
    # Cargar flashcards
    print("\n🃏 Cargando flashcards...")
    load_flashcards_from_json()
    
    # Crear logros
    print("\n🏆 Creando logros...")
    create_default_achievements()
    
    print("\n" + "=" * 50)
    print("✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE")
    print(f"📁 Ubicación: {DB_PATH}")
    print("=" * 50)

if __name__ == "__main__":
    main()
