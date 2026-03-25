#!/usr/bin/env python3
import os
import sys
import json
import sqlite3
from datetime import datetime

# Configurar ruta de la base de datos
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'frases.db')
os.makedirs(os.path.dirname(db_path), exist_ok=True)

def init_database():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Crear tablas
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
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
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            achievement_id INTEGER,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
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
            theme TEXT DEFAULT 'light'
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Tablas creadas correctamente")

def load_data():
    # Cargar ejercicios
    with open('app/static/data/ejercicios.json', 'r', encoding='utf-8') as f:
        sentences = json.load(f)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Limpiar datos existentes
    cursor.execute("DELETE FROM sentences")
    cursor.execute("DELETE FROM flashcards")
    
    # Cargar ejercicios
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
    
    # Cargar flashcards
    with open('app/static/data/flashcards.json', 'r', encoding='utf-8') as f:
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
    print(f"✅ Cargados {len(sentences)} ejercicios y {len(flashcards)} flashcards")

if __name__ == "__main__":
    init_database()
    load_data()
    print("✅ Base de datos inicializada correctamente")
