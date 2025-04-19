from flask import Flask
from flask_restful import Api
from config import Config
from resources.pdf_chat import PDFChatService
from resources.url_chat import URLChatService
from resources.askai import AskAI
from flask_cors import CORS
import os
import shutil


app = Flask(__name__)
app.config.from_object(Config)
api = Api(app)
CORS(app, resources={r"/*": {"origins": "*"}})

# Register resources
api.add_resource(PDFChatService, "/upload", "/ask")

api.add_resource(URLChatService, "/process_url", "/ask_question")

api.add_resource(AskAI, "/askai")


from utils.database import MongoDBManager, URLDBManager
from flask import jsonify

db_manager = MongoDBManager()
url_db_manager = URLDBManager()


@app.route("/api/chats", methods=["GET"])
def get_all_chats():
    chats = db_manager.get_all_chat_records()
    return jsonify(chats), 200


@app.route("/api/chats/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    chat_record = db_manager.get_chat_record(chat_id)
    if not chat_record:
        return jsonify({"error": "Chat not found"}), 404

    chat_record.pop("_id", None)
    return jsonify(chat_record)


@app.route("/api/chats/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    deleted_count = db_manager.delete_chat_record(chat_id)

    if deleted_count == 0:
        return jsonify({"error": "Chat not found"}), 404

    # Attempt to delete the corresponding file
    file_path = f"chat_indexes/faiss_index_{chat_id}"
    try:
        if os.path.exists(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        # Log the error or handle it as needed (not fatal for API success)
        print(f"Warning: Failed to delete file {file_path}: {e}")

    return jsonify({"message": "Chat deleted successfully"}), 200


@app.route("/api/chats/<chat_id>/title", methods=["GET"])
def get_chat_title(chat_id):
    chat_record = db_manager.get_chat_title(chat_id)  # Fix method name here
    if not chat_record:
        return jsonify({"error": "Chat not found"}), 404

    # Optionally format to include only what you want in the response
    return jsonify({"name": chat_record.get("name")})


@app.route("/api/urls", methods=["GET"])
def get_all_urls():
    chats = url_db_manager.get_all_url_records()
    return jsonify(chats), 200


@app.route("/api/url-chat/<url_id>", methods=["GET"])
def get_url_chat(url_id):
    chat_record = url_db_manager.get_url_record(url_id)
    if not chat_record:
        return jsonify({"error": "Chat not found"}), 404

    chat_record.pop("_id", None)
    return jsonify(chat_record)


@app.route("/api/url-chat/<url_id>/title", methods=["GET"])
def get_url_title(url_id):
    chat_record = url_db_manager.get_url_title(url_id)  # Fix method name here
    if not chat_record:
        return jsonify({"error": "Chat not found"}), 404

    # Optionally format to include only what you want in the response
    return jsonify({"name": chat_record.get("name")})


@app.route("/api/url-chat/<url_id>", methods=["DELETE"])
def delete_url_chat(url_id):
    deleted_count = url_db_manager.delete_url_record(url_id)
    if deleted_count == 0:
        return jsonify({"error": "Chat not found"}), 404

    # Attempt to delete the corresponding file
    file_path = f"url indexes/faiss_index_{url_id}"
    try:
        if os.path.exists(file_path):
            shutil.rmtree(file_path)
    except Exception as e:
        # Log the error or handle it as needed (not fatal for API success)
        print(f"Warning: Failed to delete file {file_path}: {e}")

    return jsonify({"message": "Chat deleted successfully"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
