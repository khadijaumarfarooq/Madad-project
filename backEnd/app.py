import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables cross-origin requests from frontend

DB_FILE = os.path.join(os.path.dirname(__file__), 'database.db')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            author TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# --- API Endpoints ---

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Madad API"}), 200

@app.route('/api/requests', methods=['GET'])
def get_requests():
    conn = get_db()
    requests = conn.execute('SELECT * FROM requests ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in requests])

@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO requests (title, category, location, author, description, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['title'], data['category'], data['location'], data['author'], data['description'], 'Open'))
    conn.commit()
    req_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': req_id, 'message': 'Request created successfully'}), 201

@app.route('/api/requests/<int:req_id>/status', methods=['PATCH'])
def update_status(req_id):
    data = request.json
    new_status = data.get('status')
    conn = get_db()
    conn.execute('UPDATE requests SET status = ? WHERE id = ?', (new_status, req_id))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Status updated to {new_status}'})

@app.route('/api/requests/<int:req_id>', methods=['DELETE'])
def delete_request(req_id):
    conn = get_db()
    conn.execute('DELETE FROM requests WHERE id = ?', (req_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Request deleted successfully'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
