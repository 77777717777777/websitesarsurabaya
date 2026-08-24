import decimal

from flask import Flask, jsonify, send_from_directory
from flask.json.provider import DefaultJSONProvider

from config import SECRET_KEY, FLASK_DEBUG, FLASK_PORT
from routes.public_routes import public_bp
from routes.admin_routes import admin_bp


class NumericJSONProvider(DefaultJSONProvider):
    """SUM()/AVG() come back from PyMySQL as decimal.Decimal, which Flask's
    default provider serializes as a quoted string. Convert to a real JSON number."""
    @staticmethod
    def default(o):
        if isinstance(o, decimal.Decimal):
            return float(o) if (o % 1) else int(o)
        return DefaultJSONProvider.default(o)


# static_url_path='' serves everything in static/ from the root (e.g. static/js/api.js
# -> /js/api.js), so index.html's relative <script src="js/..."> tags work unmodified.
# Frontend and API now share one origin/port, so no CORS setup is needed.
app = Flask(__name__, static_folder='static', static_url_path='')
app.json = NumericJSONProvider(app)
app.config['SECRET_KEY'] = SECRET_KEY

app.register_blueprint(public_bp)
app.register_blueprint(admin_bp)


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'data': None, 'message': 'Endpoint tidak ditemukan.'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'success': False, 'data': None, 'message': 'Terjadi kesalahan pada server.'}), 500


@app.route('/api/health')
def health():
    return jsonify({'success': True, 'data': {'status': 'ok'}, 'message': 'SAR Dashboard API aktif.'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=FLASK_PORT, debug=FLASK_DEBUG)
