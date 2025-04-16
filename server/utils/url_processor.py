import uuid
import traceback
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import WebBaseLoader


class URLProcessor:
    """Handles all URL processing and vector store operations"""

    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    def get_text_from_url(self, url):
        """Extracts text content from a given URL."""
        try:
            loader = WebBaseLoader(url)
            documents = loader.load()
            return "\n\n".join([doc.page_content for doc in documents])
        except Exception as e:
            print(f"Error loading URL content: {e}")
            return None

    def get_text_chunks(self, text):
        """Splits extracted text into manageable chunks."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=10000, chunk_overlap=1000
        )
        return text_splitter.split_text(text)

    def create_vector_store(self, text_chunks, url_id):
        """
        Creates and saves vector store with a unique identifier.
        Returns the vector store instance.
        """
        vector_store = FAISS.from_texts(text_chunks, embedding=self.embeddings)
        vector_store.save_local(f"url indexes/faiss_index_{url_id}")
        return vector_store

    def load_vector_store(self, url_id):
        """
        Loads the FAISS vector store for a given URL ID.
        Returns the vector store instance.
        """
        return FAISS.load_local(
            f"url indexes/faiss_index_{url_id}",
            self.embeddings,
            allow_dangerous_deserialization=True,
        )

    def process_url(self, url):
        """
        Main method to process a URL.
        Returns tuple: (url_id, error_message)
        """
        try:
            if not url:
                return None, "No URL provided"

            url_id = str(uuid.uuid4())
            raw_text = self.get_text_from_url(url)

            if not raw_text:
                return None, "Failed to extract text from the URL"

            text_chunks = self.get_text_chunks(raw_text)
            if not text_chunks:
                return None, "Failed to split text into chunks"

            self.create_vector_store(text_chunks, url_id)
            return url_id, None

        except Exception as e:
            print("Error in URLProcessor:", traceback.format_exc())
            return None, f"Failed to process URL: {str(e)}"
