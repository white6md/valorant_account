from extensions import db
from flask_login import UserMixin
from datetime import datetime
import json

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    orders = db.relationship('Order', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False, default="Combo 10 Random Valorant Accounts")
    accounts_data = db.Column(db.Text, nullable=False) # Storing JSON string of accounts
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_accounts(self, accounts_list):
        self.accounts_data = json.dumps(accounts_list)

    def get_accounts(self):
        return json.loads(self.accounts_data)

    def __repr__(self):
        return f'<Order {self.id}>'
