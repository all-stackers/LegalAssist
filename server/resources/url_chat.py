from flask import request, jsonify
from flask_restful import Resource
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from utils.url_processor import URLProcessor
from utils.database import URLDBManager
import traceback
from datetime import datetime


class URLChatService(Resource):
    """Handles the chat API endpoints and question answering with database storage"""

    def __init__(self):
        self.model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)
        self.url_processor = URLProcessor()
        self.db_manager = URLDBManager()

    def post(self):
        """Main endpoint for both URL processing and question answering"""
        if "url" in request.json:
            return self._handle_url_processing(request.json)
        elif "url_id" in request.json and "question" in request.json:
            return self._handle_question(request.json)
        return jsonify({"error": "Invalid request parameters"}), 400

    def _handle_url_processing(self, data):
        """Processes a URL, stores in database, and returns its ID"""
        url = data.get("url")
        url_id, error = self.url_processor.process_url(url)

        if error:
            return jsonify({"error": error}), 400

        # Get context from the URL (first part of the content)
        raw_text = self.url_processor.get_text_from_url(url)
        text_chunks = self.url_processor.get_text_chunks(raw_text)
        context = " ".join(text_chunks[:3])[:3000]  # Keep context short

        # Generate metadata using LLM
        name = self._generate_metadata(
            context, "Generate a short and meaningful name for this URL content."
        )
        description = self._generate_metadata(
            context, "Write a 20-25 word description summarizing the URL content."
        )

        # Prepare database record
        chat_record = {
            "url_id": url_id,
            "url": url,
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "status": "processed",
            "name": name,
            "description": description,
            "questions": [],
        }

        self.db_manager.create_url_record(chat_record)

        return {
            "message": "URL processed successfully",
            "url_id": url_id,
            "url_info": {
                "url": url,
                "title": name,
                "description": description,
            },
        }, 200

    def _handle_question(self, data):
        """Answers a question about a processed URL and stores in database"""
        try:
            url_id = data["url_id"]
            user_question = data["question"]

            # Get answer first
            vector_store = self.url_processor.load_vector_store(url_id)
            docs = vector_store.similarity_search(user_question)

            if not docs:
                return jsonify({"error": "No relevant content found"}), 200

            chain = self._get_conversational_chain()
            response = chain(
                {"input_documents": docs, "question": user_question},
                return_only_outputs=True,
            )
            answer = response.get("output_text", "No response")

            # Update database with the new question
            question_record = {
                "question": user_question,
                "answer": answer,
                "timestamp": datetime.utcnow(),
            }
            update_data = {
                "$push": {"questions": question_record},
                "$set": {"last_activity": datetime.utcnow()},
            }
            self.db_manager.update_url_record(url_id, update_data)

            return {"answer": answer}, 200

        except Exception as e:
            print("Error answering question:", traceback.format_exc())
            return jsonify({"error": str(e)}), 500

    def _get_conversational_chain(self):
        """Creates the QA chain with prompt template"""
        prompt_template = """
        Answer based on the context. If answer isn't in context, say: 
        'Answer is not available in the context.'
        
        Context:\n{context}\n
        Question:\n{question}\n
        
        Answer:
        """
        prompt = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )
        return load_qa_chain(self.model, chain_type="stuff", prompt=prompt)

    def _generate_metadata(self, context, prompt):
        """Helper method to generate metadata using LLM"""
        chain = self._get_conversational_chain()
        result = chain.invoke(
            {"input_documents": [], "question": f"{prompt}\n\nContent:\n{context}"}
        )
        return result["output_text"].strip()
