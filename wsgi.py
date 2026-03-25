import sys
import os

# Agregar el directorio del proyecto al path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Configurar variables de entorno
os.environ['FLASK_APP'] = 'run.py'
os.environ['FLASK_ENV'] = 'production'

# Importar la aplicación
from run import app as application
