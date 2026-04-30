"""
Point d'entrée pour uvicorn : importe l'app depuis backend/main.py
Usage : uvicorn main:app --reload
"""

from backend.main import app

__all__ = ["app"]
