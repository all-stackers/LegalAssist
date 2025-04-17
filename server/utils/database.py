from pymongo import MongoClient
from datetime import datetime
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class MongoDBManager:
    """EXISTING CLASS - DO NOT MODIFY (Production)"""

    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_URI"))
        self.db = self.client.get_database("chat_db")
        self.chats_collection = self.db["chats"]

    def get_all_chat_records(self):
        """Retrieve all chat records with selected fields, sorted by last_activity descending"""
        chats = self.chats_collection.find(
            {},
            {
                "_id": 0,
                "chat_id": 1,
                "name": 1,
                "description": 1,
                "keywords": 1,
                "last_activity": 1,
            },
        ).sort("last_activity", -1)
        return list(chats)

    def get_chat_title(self, chat_id):
        """Retrieve only the chat title (name) by chat_id"""
        return self.chats_collection.find_one(
            {"chat_id": chat_id}, {"_id": 0, "name": 1}
        )

    def create_chat_record(self, chat_data):
        """Insert a new chat record into MongoDB"""
        return self.chats_collection.insert_one(chat_data)

    def get_chat_record(self, chat_id):
        """Retrieve a chat record by chat_id"""
        return self.chats_collection.find_one({"chat_id": chat_id})

    def update_chat_record(self, chat_id, update_data):
        """Update an existing chat record"""
        return self.chats_collection.update_one({"chat_id": chat_id}, update_data)

    def delete_chat_record(self, chat_id):
        """Delete a chat record by chat_id"""
        result = self.chats_collection.delete_one({"chat_id": chat_id})
        return result.deleted_count  # returns 1 if deleted, 0 if not found


class URLDBManager:
    """NEW CLASS - For URL documents (Mirrors ChatDB structure but separate collection)"""

    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_URI"))
        self.db = self.client.get_database(
            "chat_db"
        )  # Same DB but different collection
        self.urls_collection = self.db["url_chats"]  # Separate collection for URLs

    def get_all_url_records(self):
        """Mirror of get_all_chat_records but for URLs"""
        urls = self.urls_collection.find(
            {},
            {
                "_id": 0,
                "url_id": 1,  # Keeping same field name for compatibility
                "name": 1,
                "description": 1,
                "last_activity": 1,
                "url": 1,  # Additional URL-specific field
            },
        ).sort("last_activity", -1)
        return list(urls)

    def get_url_title(self, url_id):
        """Mirror of get_chat_title but for URLs"""
        return self.urls_collection.find_one({"url_id": url_id}, {"_id": 0, "name": 1})

    def create_url_record(self, url_data):
        """Mirror of create_chat_record but expects 'url' field"""
        if "url" not in url_data:
            raise ValueError("URL field is required")
        return self.urls_collection.insert_one(url_data)

    def get_url_record(self, url_id):
        """Mirror of get_chat_record but for URLs"""
        return self.urls_collection.find_one({"url_id": url_id})

    def update_url_record(self, url_id, update_data):
        """Mirror of update_chat_record but for URLs"""
        return self.urls_collection.update_one({"url_id": url_id}, update_data)

    def add_url_question_answer(self, url_id, question, answer):
        """Special method for URL Q&A (matches chat pattern)"""
        qa_record = {
            "question": question,
            "answer": answer,
            "timestamp": datetime.utcnow(),
        }
        return self.urls_collection.update_one(
            {"url_id": url_id},
            {
                "$push": {"questions": qa_record},
                "$set": {"last_activity": datetime.utcnow()},
            },
        )

    def delete_url_record(self, url_id):
        """Delete a chat record by chat_id"""
        result = self.urls_collection.delete_one({"url_id": url_id})
        return result.deleted_count  # returns 1 if deleted, 0 if not found


class UnifiedDBManager:
    """Optional unified interface that works with both"""

    def __init__(self):
        self.chat_db = MongoDBManager()
        self.url_db = URLDBManager()

    def get_all_records(self):
        """Combine both chat and URL records"""
        chats = self.chat_db.get_all_chat_records()
        urls = self.url_db.get_all_url_records()
        return sorted(chats + urls, key=lambda x: x["last_activity"], reverse=True)
