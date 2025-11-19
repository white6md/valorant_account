from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, login_manager
from models import User, Order
import random
import string

main_bp = Blueprint('main', __name__)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def generate_random_account():
    username = 'val_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    password = ''.join(random.choices(string.ascii_letters + string.digits + "!@#", k=12))
    return {"username": username, "password": password}

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Registration successful'}), 201

@main_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        return jsonify({'message': 'Login successful', 'username': user.username})
    
    return jsonify({'error': 'Invalid username or password'}), 401

@main_bp.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'})

@main_bp.route('/api/user_info', methods=['GET'])
def user_info():
    if current_user.is_authenticated:
        return jsonify({'is_authenticated': True, 'username': current_user.username})
    return jsonify({'is_authenticated': False})

@main_bp.route('/api/buy', methods=['POST'])
@login_required
def buy():
    data = request.get_json()
    product_name = data.get('product_name', 'Combo 10 Random Valorant Accounts')
    # In a real app, validate price/product on backend. 
    # For now, we simulate different account types based on name.
    
    count = 10
    if "5" in product_name: count = 5
    if "1" in product_name: count = 1
    
    # Generate random accounts
    accounts = [generate_random_account() for _ in range(count)]
    
    new_order = Order(user_id=current_user.id, product_name=product_name)
    new_order.set_accounts(accounts)
    
    db.session.add(new_order)
    db.session.commit()
    
    return jsonify({'message': 'Purchase successful', 'order_id': new_order.id, 'accounts': accounts})

@main_bp.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    orders_data = []
    for order in orders:
        orders_data.append({
            'id': order.id,
            'product_name': order.product_name,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'accounts': order.get_accounts()
        })
    return jsonify({'orders': orders_data})
