from flask import Flask, render_template, request, jsonify
from clickhouse_driver import Client as ClickHouseClient
from clickhouse_driver.errors import Error as ClickHouseError
import csv
import os
import jwt
from io import StringIO
from datetime import datetime

app = Flask(__name__)

# Helper function to validate JWT token
def validate_jwt_token(token):
    try:
        # In a real application, you would verify the token against your auth service
        decoded = jwt.decode(token, options={"verify_signature": False})
        return True
    except jwt.exceptions.DecodeError:
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/connect-clickhouse', methods=['POST'])
def connect_clickhouse():
    data = request.json
    host = data.get('host')
    port = data.get('port')
    database = data.get('database')
    user = data.get('user')
    jwt_token = data.get('jwtToken')
    
    if not validate_jwt_token(jwt_token):
        return jsonify({'error': 'Invalid JWT token'}), 401
    
    try:
        client = ClickHouseClient(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=jwt_token,
            secure=True if port in ['9440', '8443'] else False
        )
        
        # Test connection
        tables = client.execute('SHOW TABLES')
        return jsonify({
            'success': True,
            'tables': [table[0] for table in tables]
        })
    except ClickHouseError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-table-columns', methods=['POST'])
def get_table_columns():
    data = request.json
    host = data.get('host')
    port = data.get('port')
    database = data.get('database')
    user = data.get('user')
    jwt_token = data.get('jwtToken')
    table = data.get('table')
    
    try:
        client = ClickHouseClient(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=jwt_token,
            secure=True if port in ['9440', '8443'] else False
        )
        
        columns = client.execute(f'DESCRIBE TABLE {table}')
        return jsonify({
            'success': True,
            'columns': [{'name': col[0], 'type': col[1]} for col in columns]
        })
    except ClickHouseError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-file-columns', methods=['POST'])
def get_file_columns():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    delimiter = request.form.get('delimiter', ',')
    
    try:
        # Read first line to get headers
        stream = StringIO(file.stream.read().decode('utf-8'))
        reader = csv.reader(stream, delimiter=delimiter)
        headers = next(reader)
        
        return jsonify({
            'success': True,
            'columns': [{'name': header, 'type': 'string'} for header in headers]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/preview-data', methods=['POST'])
def preview_data():
    source_type = request.form.get('sourceType')
    
    if source_type == 'clickhouse':
        data = request.form
        host = data.get('host')
        port = data.get('port')
        database = data.get('database')
        user = data.get('user')
        jwt_token = data.get('jwtToken')
        table = data.get('table')
        columns = data.getlist('columns[]')
        
        try:
            client = ClickHouseClient(
                host=host,
                port=int(port),
                database=database,
                user=user,
                password=jwt_token,
                secure=True if port in ['9440', '8443'] else False
            )
            
            query = f'SELECT {", ".join(columns)} FROM {table} LIMIT 100'
            data = client.execute(query)
            
            return jsonify({
                'success': True,
                'data': data,
                'columns': columns
            })
        except ClickHouseError as e:
            return jsonify({'error': str(e)}), 500
    
    elif source_type == 'file':
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        delimiter = request.form.get('delimiter', ',')
        columns = request.form.getlist('columns[]')
        
        try:
            stream = StringIO(file.stream.read().decode('utf-8'))
            reader = csv.DictReader(stream, delimiter=delimiter)
            
            # Get indices of selected columns
            data = []
            for row in reader:
                filtered_row = {col: row[col] for col in columns}
                data.append(filtered_row)
                if len(data) >= 100:
                    break
            
            return jsonify({
                'success': True,
                'data': data,
                'columns': columns
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid source type'}), 400

@app.route('/export-clickhouse-to-file', methods=['POST'])
def export_clickhouse_to_file():
    data = request.json
    host = data.get('host')
    port = data.get('port')
    database = data.get('database')
    user = data.get('user')
    jwt_token = data.get('jwtToken')
    table = data.get('table')
    columns = data.get('columns')
    filename = data.get('filename', f'export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
    
    try:
        client = ClickHouseClient(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=jwt_token,
            secure=True if port in ['9440', '8443'] else False
        )
        
        query = f'SELECT {", ".join(columns)} FROM {table}'
        data = client.execute(query)
        
        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        writer.writerows(data)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'data': output.getvalue(),
            'count': len(data)
        })
    except ClickHouseError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/import-file-to-clickhouse', methods=['POST'])
def import_file_to_clickhouse():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    delimiter = request.form.get('delimiter', ',')
    host = request.form.get('host')
    port = request.form.get('port')
    database = request.form.get('database')
    user = request.form.get('user')
    jwt_token = request.form.get('jwtToken')
    table = request.form.get('table')
    columns = request.form.getlist('columns[]')
    create_new_table = request.form.get('createNewTable') == 'true'
    
    try:
        client = ClickHouseClient(
            host=host,
            port=int(port),
            database=database,
            user=user,
            password=jwt_token,
            secure=True if port in ['9440', '8443'] else False
        )
        
        if create_new_table:
            # Create a simple table with all columns as String
            create_query = f"""
            CREATE TABLE IF NOT EXISTS {table} (
                {', '.join([f'{col} String' for col in columns])}
            ) ENGINE = MergeTree()
            ORDER BY tuple()
            """
            client.execute(create_query)
        
        # Read and insert data in batches
        stream = StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(stream, delimiter=delimiter)
        
        batch = []
        count = 0
        for row in reader:
            batch.append([row[col] for col in columns])
            count += 1
            
            if len(batch) >= 1000:  # Batch size
                client.execute(f"""
                INSERT INTO {table} ({', '.join(columns)})
                VALUES
                """, batch)
                batch = []
        
        if batch:
            client.execute(f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES
            """, batch)
        
        return jsonify({
            'success': True,
            'count': count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)