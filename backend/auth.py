from functools import wraps
from flask import session, jsonify
from werkzeug.security import check_password_hash
from db import query_one


def verify_admin_login(username, password):
    admin = query_one(
        "SELECT id_admin, username, password, nama_lengkap, status FROM admin WHERE username = %s",
        (username,),
    )
    if not admin:
        return None
    if admin['status'] != 'aktif':
        return None
    if not check_password_hash(admin['password'], password):
        return None
    return admin


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not session.get('id_admin'):
            return jsonify({'success': False, 'data': None, 'message': 'Unauthorized, silakan login terlebih dahulu.'}), 401
        return view_func(*args, **kwargs)
    return wrapped
