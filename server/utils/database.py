from pymongo import MongoClient
from datetime import datetime
import os


class MongoDBManager:
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
        ).sort(
            "last_activity", -1
        )  # -1 for descending order
        return list(chats)

    def get_chat_title(self, chat_id):
        """Retrieve only the chat title (name) by chat_id"""
        return self.chats_collection.find_one(
            {"chat_id": chat_id}, {"_id": 0, "name": 1}  # Also exclude _id
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
