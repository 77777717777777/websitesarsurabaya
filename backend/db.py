import pymysql
from pymysql.cursors import DictCursor
from config import DB_CONFIG


def get_connection():
    return pymysql.connect(cursorclass=DictCursor, autocommit=False, **DB_CONFIG)


def query_all(sql, params=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchall()
    finally:
        conn.close()


def query_one(sql, params=None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchone()
    finally:
        conn.close()


def execute(sql, params=None):
    """INSERT/UPDATE/DELETE dengan commit otomatis. Return lastrowid."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            conn.commit()
            return cur.lastrowid
    finally:
        conn.close()
