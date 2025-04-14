document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const sourceTypeSelect = document.getElementById('sourceType');
    const targetTypeSelect = document.getElementById('targetType');
    const clickhouseSourceConfig = document.getElementById('clickhouseSourceConfig');
    const fileSourceConfig = document.getElementById('fileSourceConfig');
    const clickhouseTargetConfig = document.getElementById('clickhouseTargetConfig');
    const fileTargetConfig = document.getElementById('fileTargetConfig');
    const connectClickHouseBtn = document.getElementById('connectClickHouse');
    const loadColumnsBtn = document.getElementById('loadColumns');
    const loadFileColumnsBtn = document.getElementById('loadFileColumns');
    const previewDataBtn = document.getElementById('previewData');
    const startIngestionBtn = document.getElementById('startIngestion');
    const columnsContainer = document.getElementById('columnsContainer');
    const columnSelectionCard = document.getElementById('columnSelectionCard');
    const statusMessage = document.getElementById('statusMessage');
    const resultMessage = document.getElementById('resultMessage');
    const previewTableContainer = document.getElementById('previewTableContainer');
    const previewTable = document.getElementById('previewTable');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');
    
    // State
    let selectedColumns = [];
    let sourceDataPreview = null;
    
    // Event Listeners
    sourceTypeSelect.addEventListener('change', toggleSourceConfig);
    targetTypeSelect.addEventListener('change', toggleTargetConfig);
    connectClickHouseBtn.addEventListener('click', connectToClickHouse);
    loadColumnsBtn.addEventListener('click', loadTableColumns);
    loadFileColumnsBtn.addEventListener('click', loadFileColumns);
    previewDataBtn.addEventListener('click', previewData);
    startIngestionBtn.addEventListener('click', startIngestion);
    
    // Initialize
    toggleSourceConfig();
    toggleTargetConfig();
    
    // Functions
    function toggleSourceConfig() {
        const sourceType = sourceTypeSelect.value;
        clickhouseSourceConfig.style.display = sourceType === 'clickhouse' ? 'block' : 'none';
        fileSourceConfig.style.display = sourceType === 'file' ? 'block' : 'none';
        columnSelectionCard.style.display = 'none';
        previewTableContainer.style.display = 'none';
    }
    
    function toggleTargetConfig() {
        const targetType = targetTypeSelect.value;
        clickhouseTargetConfig.style.display = targetType === 'clickhouse' ? 'block' : 'none';
        fileTargetConfig.style.display = targetType === 'file' ? 'block' : 'none';
    }
    
    function connectToClickHouse() {
        const host = document.getElementById('chHost').value;
        const port = document.getElementById('chPort').value;
        const database = document.getElementById('chDatabase').value;
        const user = document.getElementById('chUser').value;
        const jwtToken = document.getElementById('chJwtToken').value;
        
        if (!host || !port || !database || !user || !jwtToken) {
            showError('Please fill all connection parameters');
            return;
        }
        
        updateStatus('Connecting to ClickHouse...');
        
        fetch('/connect-clickhouse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host,
                port,
                database,
                user,
                jwtToken
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            updateStatus('Connected successfully');
            
            // Populate tables dropdown
            const tablesSelect = document.getElementById('chTables');
            tablesSelect.innerHTML = '';
            data.tables.forEach(table => {
                const option = document.createElement('option');
                option.value = table;
                option.textContent = table;
                tablesSelect.appendChild(option);
            });
            
            // Show tables section
            document.getElementById('chTablesSection').style.display = 'block';
        })
        .catch(error => {
            showError('Connection failed: ' + error.message);
        });
    }
    
    function loadTableColumns() {
        const host = document.getElementById('chHost').value;
        const port = document.getElementById('chPort').value;
        const database = document.getElementById('chDatabase').value;
        const user = document.getElementById('chUser').value;
        const jwtToken = document.getElementById('chJwtToken').value;
        const table = document.getElementById('chTables').value;
        
        if (!table) {
            showError('Please select a table');
            return;
        }
        
        updateStatus('Loading table columns...');
        
        fetch('/get-table-columns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host,
                port,
                database,
                user,
                jwtToken,
                table
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            updateStatus('Columns loaded successfully');
            renderColumnSelection(data.columns);
        })
        .catch(error => {
            showError('Failed to load columns: ' + error.message);
        });
    }
    
    function loadFileColumns() {
        const fileInput = document.getElementById('sourceFile');
        const delimiter = document.getElementById('fileDelimiter').value;
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select a file');
            return;
        }
        
        updateStatus('Reading file columns...');
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('delimiter', delimiter);
        
        fetch('/get-file-columns', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            updateStatus('File columns read successfully');
            renderColumnSelection(data.columns);
        })
        .catch(error => {
            showError('Failed to read file columns: ' + error.message);
        });
    }
    
    function renderColumnSelection(columns) {
        columnsContainer.innerHTML = '';
        selectedColumns = [];
        
        columns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'form-check';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input column-checkbox';
            checkbox.id = `col-${column.name}`;
            checkbox.value = column.name;
            checkbox.checked = true;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `col-${column.name}`;
            label.textContent = `${column.name} (${column.type})`;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            columnsContainer.appendChild(div);
            
            // Track selected columns
            selectedColumns.push(column.name);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    if (!selectedColumns.includes(this.value)) {
                        selectedColumns.push(this.value);
                    }
                } else {
                    selectedColumns = selectedColumns.filter(col => col !== this.value);
                }
            });
        });
        
        columnSelectionCard.style.display = 'block';
    }
    
    function previewData() {
        const sourceType = sourceTypeSelect.value;
        
        updateStatus('Loading preview data...');
        
        if (sourceType === 'clickhouse') {
            const host = document.getElementById('chHost').value;
            const port = document.getElementById('chPort').value;
            const database = document.getElementById('chDatabase').value;
            const user = document.getElementById('chUser').value;
            const jwtToken = document.getElementById('chJwtToken').value;
            const table = document.getElementById('chTables').value;
            
            if (selectedColumns.length === 0) {
                showError('Please select at least one column');
                return;
            }
            
            const formData = new FormData();
            formData.append('sourceType', 'clickhouse');
            formData.append('host', host);
            formData.append('port', port);
            formData.append('database', database);
            formData.append('user', user);
            formData.append('jwtToken', jwtToken);
            formData.append('table', table);
            selectedColumns.forEach(col => formData.append('columns[]', col));
            
            fetch('/preview-data', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                    return;
                }
                
                updateStatus('Preview data loaded successfully');
                displayPreviewData(data);
            })
            .catch(error => {
                showError('Failed to load preview data: ' + error.message);
            });
            
        } else if (sourceType === 'file') {
            const fileInput = document.getElementById('sourceFile');
            const delimiter = document.getElementById('fileDelimiter').value;
            
            if (!fileInput.files || fileInput.files.length === 0) {
                showError('Please select a file');
                return;
            }
            
            if (selectedColumns.length === 0) {
                showError('Please select at least one column');
                return;
            }
            
            const formData = new FormData();
            formData.append('sourceType', 'file');
            formData.append('file', fileInput.files[0]);
            formData.append('delimiter', delimiter);
            selectedColumns.forEach(col => formData.append('columns[]', col));
            
            fetch('/preview-data', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                    return;
                }
                
                updateStatus('Preview data loaded successfully');
                displayPreviewData(data);
            })
            .catch(error => {
                showError('Failed to load preview data: ' + error.message);
            });
        }
    }
    
    function displayPreviewData(data) {
        sourceDataPreview = data;
        
        // Clear previous table
        previewTable.querySelector('thead').innerHTML = '';
        previewTable.querySelector('tbody').innerHTML = '';
        
        // Create header
        const headerRow = document.createElement('tr');
        data.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        });
        previewTable.querySelector('thead').appendChild(headerRow);
        
        // Create rows
        data.data.forEach(rowData => {
            const row = document.createElement('tr');
            
            if (Array.isArray(rowData)) {
                // ClickHouse data (array)
                rowData.forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value !== null ? value : 'NULL';
                    row.appendChild(td);
                });
            } else {
                // File data (object)
                data.columns.forEach(column => {
                    const td = document.createElement('td');
                    td.textContent = rowData[column] !== undefined ? rowData[column] : '';
                    row.appendChild(td);
                });
            }
            
            previewTable.querySelector('tbody').appendChild(row);
        });
        
        previewTableContainer.style.display = 'block';
    }
    
    function startIngestion() {
        const sourceType = sourceTypeSelect.value;
        const targetType = targetTypeSelect.value;
        
        if (selectedColumns.length === 0) {
            showError('Please select at least one column');
            return;
        }
        
        if (sourceType === 'clickhouse' && targetType === 'file') {
            exportClickHouseToFile();
        } else if (sourceType === 'file' && targetType === 'clickhouse') {
            importFileToClickHouse();
        } else {
            showError('This combination of source and target is not supported yet');
        }
    }
    
    function exportClickHouseToFile() {
        const host = document.getElementById('chHost').value;
        const port = document.getElementById('chPort').value;
        const database = document.getElementById('chDatabase').value;
        const user = document.getElementById('chUser').value;
        const jwtToken = document.getElementById('chJwtToken').value;
        const table = document.getElementById('chTables').value;
        const filename = document.getElementById('outputFilename').value || 'export.csv';
        
        updateStatus('Exporting data from ClickHouse to file...');
        
        fetch('/export-clickhouse-to-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                host,
                port,
                database,
                user,
                jwtToken,
                table,
                columns: selectedColumns,
                filename
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            updateStatus('Export completed successfully');
            showResult(`Successfully exported ${data.count} records`, 'success');
            
            // Create download link
            const blob = new Blob([data.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = data.filename;
            downloadContainer.style.display = 'block';
        })
        .catch(error => {
            showError('Export failed: ' + error.message);
        });
    }
    
    function importFileToClickHouse() {
        const fileInput = document.getElementById('sourceFile');
        const delimiter = document.getElementById('fileDelimiter').value;
        const host = document.getElementById('targetChHost').value;
        const port = document.getElementById('targetChPort').value;
        const database = document.getElementById('targetChDatabase').value;
        const user = document.getElementById('targetChUser').value;
        const jwtToken = document.getElementById('targetChJwtToken').value;
        const table = document.getElementById('targetTable').value;
        const createNewTable = document.getElementById('createNewTable').checked;
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showError('Please select a file');
            return;
        }
        
        if (!table) {
            showError('Please specify a table name');
            return;
        }
        
        updateStatus('Importing data from file to ClickHouse...');
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('delimiter', delimiter);
        formData.append('host', host);
        formData.append('port', port);
        formData.append('database', database);
        formData.append('user', user);
        formData.append('jwtToken', jwtToken);
        formData.append('table', table);
        formData.append('createNewTable', createNewTable);
        selectedColumns.forEach(col => formData.append('columns[]', col));
        
        fetch('/import-file-to-clickhouse', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            updateStatus('Import completed successfully');
            showResult(`Successfully imported ${data.count} records`, 'success');
        })
        .catch(error => {
            showError('Import failed: ' + error.message);
        });
    }
    
    function updateStatus(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'alert alert-info';
    }
    
    function showError(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'alert alert-danger';
    }
    
    function showResult(message, type) {
        resultMessage.textContent = message;
        resultMessage.className = `alert alert-${type}`;
        resultMessage.style.display = 'block';
    }
});