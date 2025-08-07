# Flask Backend Setup

## Installation

1. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Save the Flask code as `flask_backend.py`**

4. **Run the server:**
   ```bash
   python3 flask_backend.py
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### Microplates
- `GET /api/microplates` - Get all microplates
- `POST /api/microplates` - Create a new microplate

### Measurements
- `GET /api/microplates/<id>/measurements/latest` - Get latest measurement for each well
- `POST /api/microplates/<id>/measurements` - Add new measurement

## Database Schema

### Microplates Table
- `id` (Primary Key)
- `name` (Unique identifier)
- `rows` (Number of rows, default: 2)
- `columns` (Number of columns, default: 3)
- `created_at` (Timestamp)

### Measurements Table
- `id` (Primary Key)
- `microplate_id` (Foreign Key)
- `row` (0-based index: 0=A, 1=B)
- `column` (0-based index: 0=1, 1=2, 2=3)
- `confluency_percentage` (0-100)
- `timestamp` (Auto-generated)

## Database File

The SQLite database file (`confluency_tracker.db`) will be created automatically and stored in the instance folder when you first run the application. A sample microplate "Plate-001" is created on first startup.