# oracle_bridge.py

import sys
import json
import chromadb
from chromadb.utils import embedding_functions

# --- Configuration ---
CHROMA_PATH = "./.brandos/chroma"
COLLECTION_NAME = "brand_knowledge"

# --- ChromaDB Client ---
client = chromadb.PersistentClient(path=CHROMA_PATH)
# TODO: Use the embedding function provided by the Brand Builder Pro
# For now, we'll use a default one for testing.
# This will be replaced with a call to the Anthropic API.
embedding_function = embedding_functions.DefaultEmbeddingFunction()

collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=embedding_function
)

# --- Functions ---

def add_document(data):
    """Adds a document to the collection."""
    try:
        collection.add(
            documents=[data['document']],
            metadatas=[data['metadata']],
            ids=[data['id']]
        )
        return {"status": "success", "id": data['id']}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def search(data):
    """Searches the collection."""
    try:
        results = collection.query(
            query_texts=[data['query']],
            n_results=data.get('n_results', 5)
        )
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def update_document(data):
    """Updates an existing document in the collection."""
    try:
        collection.update(
            ids=[data['id']],
            documents=[data['document']],
            metadatas=[data['metadata']]
        )
        return {"status": "success", "id": data['id']}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def delete_document(data):
    """Deletes a document from the collection."""
    try:
        collection.delete(ids=[data['id']])
        return {"status": "success", "id": data['id']}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def list_documents(data):
    """Lists all documents in the collection (with optional limit)."""
    try:
        limit = data.get('limit', 10)
        results = collection.get(limit=limit)
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Main Loop ---

def main():
    """Main loop to process commands from stdin."""
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get("command")
            data = request.get("data")

            if command == "add":
                response = add_document(data)
            elif command == "search":
                response = search(data)
            elif command == "update":
                response = update_document(data)
            elif command == "delete":
                response = delete_document(data)
            elif command == "list":
                response = list_documents(data)
            else:
                response = {"status": "error", "message": "Unknown command"}

        except json.JSONDecodeError:
            response = {"status": "error", "message": "Invalid JSON"}
        except Exception as e:
            response = {"status": "error", "message": str(e)}

        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
