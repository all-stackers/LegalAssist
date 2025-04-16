from flask import request
from flask_restful import Resource
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
import uuid
from datetime import datetime
from utils.pdf_processor import PDFProcessor
from utils.database import MongoDBManager


class PDFChatService(Resource):
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.db_manager = MongoDBManager()

    def get_conversational_chain(self):
        prompt_template = """
        Answer the question as detailed as possible from the provided context. 
        If the answer is not in the provided context, just say 
        "Answer is not available in the context." 
        Do not provide incorrect information.
        
        Context: {context}
        Question: {question}
        Answer:"""

        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)
        prompt = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )
        return load_qa_chain(model, chain_type="stuff", prompt=prompt)

    def post(self):
        if "pdf" in request.files:
            return self.upload_pdf()
        return self.ask_question()

    def upload_pdf(self):
        if "pdf" not in request.files:
            return {"error": "No file uploaded"}, 400

        pdf_file = request.files["pdf"]
        pdf_id = str(uuid.uuid4())

        raw_text = self.pdf_processor.get_pdf_text(pdf_file)
        text_chunks = self.pdf_processor.get_text_chunks(raw_text)
        self.pdf_processor.get_vector_store(text_chunks, pdf_id)

        # Use the first few chunks as context
        context = " ".join(text_chunks[:3])[
            :3000
        ]  # Keep context short to avoid token limits
        chain = self.get_conversational_chain()

        # Ask LLM for metadata
        def ask(prompt):
            result = chain.invoke(
                {"input_documents": [], "question": f"{prompt}\n\nContent:\n{context}"}
            )
            return result["output_text"].strip()

        name = ask("Generate a short and meaningful name for this PDF.")
        description = ask("Write a 20-25 word description summarizing the document.")
        keywords = ask(
            "Give 3-4 important keywords or phrases relevant to the document, separated by commas."
        )

        # Prepare MongoDB record
        chat_record = {
            "chat_id": pdf_id,
            "file_name": pdf_file.filename,
            "file_size": len(pdf_file.read()),
            "upload_date": datetime.utcnow(),
            "status": "processed",
            "name": name,
            "description": description,
            "keywords": [k.strip() for k in keywords.split(",") if k.strip()],
            "questions": [],
        }

        # Reset file pointer after reading size
        pdf_file.seek(0)

        self.db_manager.create_chat_record(chat_record)

        return {
            "message": "PDF processed successfully",
            "chat_id": pdf_id,
            "file_info": {
                "name": pdf_file.filename,
                "size": chat_record["file_size"],
                "title": name,
                "description": description,
                "keywords": chat_record["keywords"],
            },
        }, 200

    def ask_question(self):
        data = request.get_json()
        chat_id = data.get("chat_id")
        user_question = data.get("question")

        if not chat_id or not user_question:
            return {"error": "Missing chat_id or question"}, 400

        # Get answer first
        docs = self.pdf_processor.load_vector_store(chat_id).similarity_search(
            user_question
        )
        chain = self.get_conversational_chain()
        response = chain.invoke({"input_documents": docs, "question": user_question})
        answer = response["output_text"]

        # Update MongoDB with the new question
        question_record = {
            "question": user_question,
            "answer": answer,
            "timestamp": datetime.utcnow(),
        }
        update_data = {
            "$push": {"questions": question_record},
            "$set": {"last_activity": datetime.utcnow()},
        }
        self.db_manager.update_chat_record(chat_id, update_data)

        return {"answer": answer}, 200
