import sqlite3
import os
import json
from datetime import datetime
import http.server
import socketserver
import urllib.parse

# データベースのパス
DB_PATH = 'budget.db'

def init_db():
    """Initialize the database with necessary tables if they don't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        memo TEXT
    )
    ''')
    
    # Create categories table with some default categories
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL
    )
    ''')
    
    # Insert default categories if they don't exist
    default_categories = [
        ('食費', 'expense'),
        ('交通費', 'expense'),
        ('住居費', 'expense'),
        ('光熱費', 'expense'),
        ('通信費', 'expense'),
        ('趣味・娯楽', 'expense'),
        ('衣服・美容', 'expense'),
        ('医療・健康', 'expense'),
        ('教育', 'expense'),
        ('その他支出', 'expense'),
        ('給料', 'income'),
        ('ボーナス', 'income'),
        ('副収入', 'income'),
        ('その他収入', 'income')
    ]
    
    for category in default_categories:
        try:
            cursor.execute("INSERT INTO categories (name, type) VALUES (?, ?)", category)
        except sqlite3.IntegrityError:
            # Category already exists, skip
            pass
    
    conn.commit()
    conn.close()

class BudgetRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler for our budget application"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Serve static files
        if path == '/':
            self.serve_file('index.html')
        elif path.startswith('/static/'):
            self.serve_file(path[1:])  # Remove leading slash
        # API endpoints
        elif path == '/api/transactions':
            self.handle_get_transactions()
        elif path == '/api/categories':
            self.handle_get_categories()
        elif path == '/api/summary':
            self.handle_get_summary()
        else:
            # Attempt to serve as a static file
            try:
                self.serve_file(path[1:])  # Remove leading slash
            except:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'Not Found')
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/transactions':
            self.handle_add_transaction()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/transactions/'):
            transaction_id = path.split('/')[-1]
            self.handle_delete_transaction(transaction_id)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def serve_file(self, file_path):
        """Serve a file with appropriate content type"""
        if file_path == 'index.html':
            file_path = 'templates/index.html'
        
        try:
            with open(file_path, 'rb') as file:
                content = file.read()
                
                self.send_response(200)
                
                if file_path.endswith('.html'):
                    self.send_header('Content-type', 'text/html')
                elif file_path.endswith('.css'):
                    self.send_header('Content-type', 'text/css')
                elif file_path.endswith('.js'):
                    self.send_header('Content-type', 'application/javascript')
                elif file_path.endswith('.json'):
                    self.send_header('Content-type', 'application/json')
                elif file_path.endswith('.png'):
                    self.send_header('Content-type', 'image/png')
                elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                    self.send_header('Content-type', 'image/jpeg')
                
                self.send_header('Content-Length', str(len(content)))
                self.end_headers()
                self.wfile.write(content)
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'File Not Found')
    
    def handle_get_transactions(self):
        """Handle GET request for transactions"""
        # Parse query parameters
        query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        
        # Get month parameter, default to current month
        month = query_params.get('month', [datetime.now().strftime('%Y-%m')])[0]
        
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Query transactions
        cursor.execute(
            "SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC",
            (f"{month}%",)
        )
        
        # Convert to list of dicts
        transactions = []
        for row in cursor.fetchall():
            transaction = {}
            for key in row.keys():
                transaction[key] = row[key]
            transactions.append(transaction)
        
        conn.close()
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(transactions).encode())
    
    def handle_get_categories(self):
        """Handle GET request for categories"""
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Query categories
        cursor.execute("SELECT * FROM categories ORDER BY type, name")
        
        # Convert to list of dicts
        categories = []
        for row in cursor.fetchall():
            category = {}
            for key in row.keys():
                category[key] = row[key]
            categories.append(category)
        
        conn.close()
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(categories).encode())
    
    def handle_get_summary(self):
        """Handle GET request for summary"""
        # Parse query parameters
        query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        
        # Get month parameter, default to current month
        month = query_params.get('month', [datetime.now().strftime('%Y-%m')])[0]
        
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get total income and expenses
        cursor.execute(
            "SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE ? GROUP BY type",
            (f"{month}%",)
        )
        
        totals = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get category breakdown for expenses
        cursor.execute(
            """
            SELECT category, SUM(amount) as total 
            FROM transactions 
            WHERE date LIKE ? AND type = 'expense' 
            GROUP BY category
            ORDER BY total DESC
            """,
            (f"{month}%",)
        )
        
        category_breakdown = [{'category': row[0], 'amount': row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        # Prepare summary data
        summary = {
            'income': totals.get('income', 0),
            'expense': totals.get('expense', 0),
            'balance': totals.get('income', 0) - totals.get('expense', 0),
            'categories': category_breakdown
        }
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(summary).encode())
    
    def handle_add_transaction(self):
        """Handle POST request to add a transaction"""
        # Get content length
        content_length = int(self.headers['Content-Length'])
        
        # Read and parse request body
        request_body = self.rfile.read(content_length).decode('utf-8')
        transaction_data = json.loads(request_body)
        
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Insert transaction
        cursor.execute(
            "INSERT INTO transactions (date, category, amount, type, memo) VALUES (?, ?, ?, ?, ?)",
            (
                transaction_data['date'],
                transaction_data['category'],
                transaction_data['amount'],
                transaction_data['type'],
                transaction_data.get('memo', '')
            )
        )
        
        conn.commit()
        transaction_id = cursor.lastrowid
        conn.close()
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'id': transaction_id, 'success': True}).encode())
    
    def handle_delete_transaction(self, transaction_id):
        """Handle DELETE request to delete a transaction"""
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete transaction
        cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        
        conn.commit()
        conn.close()
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True}).encode())

def run_server():
    """Run the HTTP server"""
    # Initialize database
    init_db()
    
    # Set up server
    port = 8080
    handler = BudgetRequestHandler
    
    # Create server
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Server running at http://localhost:{port}/")
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()