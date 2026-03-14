"""
import_to_firestore.py — Upload restaurants.json to Firestore via Admin SDK.

Usage:
    python scripts/import_to_firestore.py
"""

import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "docs" / "data" / "restaurants.json"
SERVICE_ACCOUNT = PROJECT_ROOT / "restaurants-90def-firebase-adminsdk-fbsvc-81ae4f51dc.json"
COLLECTION = "restaurants"


def make_doc_id(name: str) -> str:
    """Create a URL-safe document ID from restaurant name."""
    return name.lower().replace(" ", "-").replace("'", "").replace("&", "and")


def main() -> None:
    cred = credentials.Certificate(str(SERVICE_ACCOUNT))
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print(f"Reading {DATA_PATH}...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    print(f"Uploading {len(restaurants)} restaurants to Firestore...\n")

    success = 0
    for rest in restaurants:
        doc_id = make_doc_id(rest["name"])
        print(f"  {rest['name']} ({doc_id})...", end=" ")
        try:
            db.collection(COLLECTION).document(doc_id).set(rest)
            print("OK")
            success += 1
        except Exception as exc:
            print(f"FAILED: {exc}")

    print(f"\nDone! {success}/{len(restaurants)} uploaded.")


if __name__ == "__main__":
    main()
