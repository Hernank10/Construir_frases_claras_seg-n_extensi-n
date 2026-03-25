from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    # Configuración
    app.config['SECRET_KEY'] = 'tu-clave-secreta-aqui-cambiar-en-produccion'
    
    # Base de datos - usar ruta absoluta
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instance', 'frases.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'
    
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
