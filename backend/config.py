import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'sar_dashboard'),
    'charset': 'utf8mb4',
}

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-me')
FLASK_DEBUG = os.environ.get('FLASK_DEBUG', '1') == '1'
FLASK_PORT = int(os.environ.get('FLASK_PORT', 5000))
