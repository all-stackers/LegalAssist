import os
import json
from flask_restful import Resource, reqparse
from flask import Flask, jsonify
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from langchain_google_genai import ChatGoogleGenerativeAI

# Initialize the embedding model using HuggingFaceEmbeddings
embed_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Set environment variables for tokenizers and Google API key
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI")

# Initialize the Google Gemini Generative AI model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", temperature=0.7, max_output_tokens=4000
)


# Manually load documents from a directory and create embeddings
def load_documents(directory_path):
    documents = []
    document_texts = []
    for filename in os.listdir(directory_path):
        if filename.endswith(".json"):  # Handle JSON files
            file_path = os.path.join(directory_path, filename)
            with open(file_path, "r", encoding="utf-8") as file:
                data = json.load(file)
                # Assuming that the text is stored under a key like 'text'
                text = data.get("text", "")
                documents.append({"filename": filename, "text": text})
                document_texts.append(text)
    return documents, document_texts


# Load document texts and precompute embeddings
documents, document_texts = load_documents("./indian_penal_code_index")
document_embeddings = [embed_model.embed_query(text) for text in document_texts]


# Define a basic AskAI resource for handling incoming requests
class AskAI(Resource):
    def post(self):

        # Set up request parser and retrieve the question argument
        parser = reqparse.RequestParser()
        parser.add_argument("question", type=str, required=True)
        args = parser.parse_args()

        # Embed the question using `embed_query`
        question_embedding = embed_model.embed_query(args["question"])

        # Compute cosine similarity between question embedding and document embeddings
        similarities = cosine_similarity([question_embedding], document_embeddings)[0]
        most_similar_idx = np.argmax(similarities)

        # Fetch the most similar document text
        relevant_text = document_texts[most_similar_idx]

        # Create a prompt to ask Gemini to generate an answer based on the document
        # prompt = f"Answer the following question based on the document:\n\n{relevant_text}\n\nQuestion: {args['question']}\nAnswer:"
        prompt = f"Answer the following question based on indian law system. No bullshit answers, don't entertain question which is not relevant to legal. Answer can be in markdown formate.\n\nQuestion: {args['question']}\nAnswer:"

        # Use Gemini to generate a response
        response = llm.invoke(prompt)  # Using invoke() as in your original code

        # Extract the generated answer from the response
        answer = (
            response.content
        )  # Adjust depending on the exact structure of Gemini's response

        # Return the generated answer as JSON
        return jsonify({"error": False, "data": answer})
