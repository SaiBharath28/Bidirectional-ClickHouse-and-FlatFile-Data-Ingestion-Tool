# Bidirectional-ClickHouse-and-FlatFile-Data-Ingestion-Tool

A bidirectional data ingestion tool that facilitates seamless data transfer between ClickHouse databases and flat files.

## Features

- **Bidirectional Data Flow**: Transfer data from ClickHouse to flat files and vice versa
- **JWT Authentication**: Secure connection to ClickHouse using JWT tokens
- **Column Selection**: Choose specific columns for data ingestion
- **Schema Discovery**: Automatically discover and display available tables and schemas
- **Interactive UI**: User-friendly web interface for all operations
- **Data Preview**: Preview data before full ingestion
- **Join Support**: Configure and execute multi-table joins from ClickHouse (bonus feature)
- **Error Handling**: Robust error handling with user-friendly messages

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- Access to a ClickHouse database instance

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Bidirectional-ClickHouse-and-FlatFile-Data-Ingestion-Tool.git
   cd Bidirectional-ClickHouse-and-FlatFile-Data-Ingestion-Tool
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

No additional configuration files are needed. All connection parameters are configured through the web interface.

For testing purposes, you can use ClickHouse's example datasets:
- [UK Property Price Dataset](https://clickhouse.com/docs/getting-started/example-datasets/uk-price-paid)
- [OnTime Flight Data](https://clickhouse.com/docs/getting-started/example-datasets/ontime)

## Running the Application

1. Make sure your virtual environment is activated.

2. Start the Flask application:
   ```bash
   flask run
   ```

3. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Usage Guide

### ClickHouse to Flat File Transfer

1. Select "ClickHouse → Flat File" direction.
2. Enter your ClickHouse connection details.
3. Click "Connect" and select a table from the dropdown menu.
4. Click "Load Columns" to view available columns.
5. Select the columns you want to include in the export.
6. Enter the output file name and delimiter in the "Flat File Output" section.
7. (Optional) Enable and configure multi-table JOIN if needed.
8. Click "Preview Data" to see a sample of the data to be exported.
9. Click "Start Ingestion" to execute the transfer.
10. View the results showing the number of records processed.

### Flat File to ClickHouse Transfer

1. Select "Flat File → ClickHouse" direction.
2. Upload your flat file and specify the delimiter.
3. Click "Load File" to read the file schema.
4. Select the columns you want to import.
5. Enter your ClickHouse connection details in the "ClickHouse Target" section.
6. Specify the target table name.
7. Click "Preview Data" to see a sample of the data to be imported.
8. Click "Start Ingestion" to execute the transfer.
9. View the results showing the number of records processed.

## Multi-Table JOIN Configuration (Bonus Feature)

To use the JOIN feature:

1. Select "ClickHouse → Flat File" direction.
2. Connect to your ClickHouse database.
3. Check the "Enable Multi-Table JOIN" checkbox.
4. Select your primary table.
5. Click "Configure JOIN" to add additional tables and specify join keys.
6. Select columns from all tables for export.
7. Complete the export as usual.

## Error Handling

Common error scenarios and their solutions:

- **Connection Failed**: Verify your ClickHouse host, port, and credentials.
- **JWT Authentication Failed**: Ensure your JWT token is valid and properly formatted.
- **File Format Error**: Check that your flat file has the correct format and delimiter.
- **Permission Denied**: Verify that you have write permissions for the output directory.

## Testing

This application has been tested with the following example datasets:
- ClickHouse uk_price_paid dataset
- ClickHouse ontime dataset
- Various CSV files with different delimiters

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [ClickHouse](https://clickhouse.com/) for their powerful column-oriented database
- [Flask](https://flask.palletsprojects.com/) for the web framework
- [Bootstrap](https://getbootstrap.com/) for the UI components
