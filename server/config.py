import os


class Config:
    DEBUG = False
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/chat_db")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "chat_db")
    MONGO_CHATS_COLLECTION = os.getenv("MONGO_CHATS_COLLECTION", "chats")
