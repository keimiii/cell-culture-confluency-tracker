# Flask Backend for Cell Confluency Tracker
# Requirements: pip install flask flask-sqlalchemy flask-cors

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from sqlalchemy import desc
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///confluency_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

db = SQLAlchemy(app)
CORS(app)  # Enable CORS for React frontend

# Database Models
class Microplate(db.Model):
    """Model for microplates"""
    __tablename__ = 'microplates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    rows = db.Column(db.Integer, nullable=False, default=2)  # Number of rows (A, B)
    columns = db.Column(db.Integer, nullable=False, default=3)  # Number of columns (1, 2, 3)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationship with measurements
    measurements = db.relationship('Measurement', backref='microplate', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'rows': self.rows,
            'columns': self.columns,
            'created_at': self.created_at.isoformat()
        }

class Measurement(db.Model):
    """Model for confluency measurements"""
    __tablename__ = 'measurements'

    id = db.Column(db.Integer, primary_key=True)
    microplate_id = db.Column(db.Integer, db.ForeignKey('microplates.id'), nullable=False)
    row = db.Column(db.Integer, nullable=False)  # 0-based index (0=A, 1=B)
    column = db.Column(db.Integer, nullable=False)  # 0-based index (0=1, 1=2, 2=3)
    confluency_percentage = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Constraints
    __table_args__ = (
        db.CheckConstraint('confluency_percentage >= 0 AND confluency_percentage <= 100'),
        db.CheckConstraint('row >= 0'),
        db.CheckConstraint('column >= 0'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'microplate_id': self.microplate_id,
            'row': self.row,
            'column': self.column,
            'confluency_percentage': self.confluency_percentage,
            'timestamp': self.timestamp.isoformat(),
        }

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/microplates', methods=['GET'])
def get_microplates():
    """Get all microplates"""
    try:
        microplates = Microplate.query.all()
        return jsonify([plate.to_dict() for plate in microplates])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/microplates', methods=['POST'])
def create_microplate():
    """Create a new microplate"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
        
        # Check if microplate with this name already exists
        existing = Microplate.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Microplate with this name already exists'}), 400
        
        microplate = Microplate(
            name=data['name'],
            rows=data.get('rows', 2),
            columns=data.get('columns', 3)
        )
        
        db.session.add(microplate)
        db.session.commit()
        
        return jsonify(microplate.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/microplates/<int:microplate_id>/measurements/latest', methods=['GET'])
def get_latest_measurements(microplate_id):
    """Get the latest measurement for each well in a microplate"""
    try:
        microplate = Microplate.query.get_or_404(microplate_id)

        # Get latest measurement for each well
        latest_measurements = []

        for row in range(microplate.rows):
            for col in range(microplate.columns):
                measurement = Measurement.query.filter_by(
                    microplate_id=microplate_id,
                    row=row,
                    column=col
                ).order_by(desc(Measurement.timestamp)).first()

                if measurement:
                    latest_measurements.append(measurement.to_dict())

        return jsonify(latest_measurements)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/microplates/<int:microplate_id>/measurements', methods=['POST'])
def create_measurement(microplate_id):
    """Add a new measurement"""
    try:
        print("param", microplate_id)
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        # Validate required fields
        required_fields = ['row', 'column', 'confluency_percentage']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate microplate exists
        microplate = Microplate.query.get_or_404(microplate_id)

        # Validate row and column are within bounds
        if data['row'] < 0 or data['row'] >= microplate.rows:
            return jsonify({'error': f'Row must be between 0 and {microplate.rows - 1}'}), 400

        if data['column'] < 0 or data['column'] >= microplate.columns:
            return jsonify({'error': f'Column must be between 0 and {microplate.columns - 1}'}), 400

        # Validate confluency percentage
        confluency = float(data['confluency_percentage'])
        if confluency < 0 or confluency > 100:
            return jsonify({'error': 'Confluency percentage must be between 0 and 100'}), 400

        measurement = Measurement(
            microplate_id=microplate_id,
            row=int(data['row']),
            column=int(data['column']),
            confluency_percentage=confluency,
        )

        db.session.add(measurement)
        db.session.commit()

        return jsonify(measurement.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': 'Invalid number format'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Utility functions
def init_db():
    """Initialize the database with sample data"""
    db.create_all()
    
    # Check if sample microplate already exists
    if not Microplate.query.filter_by(name='Plate-001').first():
        sample_plate = Microplate(name='Plate-001', rows=2, columns=3)
        db.session.add(sample_plate)
        db.session.commit()
        print("Sample microplate 'Plate-001' created")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize database
    with app.app_context():
        init_db()
    
    # Run the application
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting Flask server on port {port}")
    print("API endpoints available:")
    print("  GET  /api/health")
    print("  GET  /api/microplates")
    print("  POST /api/microplates")
    print("  GET  /api/microplates/<id>/measurements/latest")
    print("  POST /api/microplates/<id>/measurements")
    print("  GET  /api/microplates/<id>/measurements/well/<row>/<column>")
    
    app.run(host='0.0.0.0', port=port, debug=debug)