from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI")


class PDFProcessor:
    @staticmethod
    def get_pdf_text(pdf_file):
        text = ""
        pdf_reader = PdfReader(pdf_file)
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text

    @staticmethod
    def get_text_chunks(text):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=100000, chunk_overlap=1000
        )
        return text_splitter.split_text(text)

    @staticmethod
    def get_vector_store(text_chunks, pdf_id):
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
        vector_store.save_local(f"chat indexes/faiss_index_{pdf_id}")
        return pdf_id

    @staticmethod
    def load_vector_store(pdf_id):
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        return FAISS.load_local(
            f"chat indexes/faiss_index_{pdf_id}",
            embeddings,
            allow_dangerous_deserialization=True,
        )
