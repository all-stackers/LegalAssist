from flask import Flask
from flask_restful import Api
from config import Config
from resources.pdf_chat import PDFChatService
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)
api = Api(app)
CORS(app, resources={r"/*": {"origins": "*"}})

# Register resources
api.add_resource(PDFChatService, "/upload", "/ask")

from utils.database import MongoDBManager
from flask import jsonify

db_manager = MongoDBManager()


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


@app.route("/api/chats/<chat_id>/title", methods=["GET"])
def get_chat_title(chat_id):
    chat_record = db_manager.get_chat_title(chat_id)  # Fix method name here
    if not chat_record:
        return jsonify({"error": "Chat not found"}), 404

    # Optionally format to include only what you want in the response
    return jsonify({"name": chat_record.get("name")})


if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
