from flask import Flask
from extensions import db, login_manager
import os

def create_app():
    app = Flask(__name__, template_folder='.')
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-g4market')
    # Default to a local mysql connection, user should update this
    # Format: mysql+pymysql://username:password@host/db_name
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:haidaica123@localhost/g4market')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    # login_manager.login_view = 'main.index' # Redirect to home if not logged in

    with app.app_context():
        # Import models to ensure they are registered with SQLAlchemy
        from models import User, Order
        
        # Import and register blueprints
        from routes import main_bp
        app.register_blueprint(main_bp)

        # Create tables if they don't exist
        # Note: In production, use migrations (Alembic)
        db.create_all() 

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
