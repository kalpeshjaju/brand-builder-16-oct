#!/usr/bin/env python3
"""
ORACLE Service Test Suite
Tests all endpoints and validates functionality
"""

import time
import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://127.0.0.1:8765"
TEST_BRAND = "test-brand"

# Test data
SAMPLE_DOCS = [
    {
        "doc_id": "doc1",
        "text": "tryloop is an intelligent iteration platform for ambitious creators. We help teams build better solutions faster through AI-powered feedback loops."
    },
    {
        "doc_id": "doc2",
        "text": "Our mission is to empower creators, developers, and innovators by providing intelligent feedback that accelerates iteration cycles and transforms trial-and-error into strategic advantage."
    },
    {
        "doc_id": "doc3",
        "text": "Core values include iteration over perfection, intelligence amplified, velocity with insight, radical transparency, and compounding improvement through continuous learning loops."
    }
]


def test_health() -> bool:
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST: Health Check")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

        print(f"✓ Health check passed")
        print(f"  Status: {data['status']}")
        print(f"  Service: {data['service']}")
        print(f"  Version: {data['version']}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_info() -> bool:
    """Test info endpoint"""
    print("\n" + "="*60)
    print("TEST: Service Info")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/api/v1/info", timeout=10)
        assert response.status_code == 200
        data = response.json()

        print(f"✓ Service info retrieved")
        print(f"  Service: {data['service']}")
        print(f"  Version: {data['version']}")
        print(f"  Embedding Model: {data['embedding_model']['name']}")
        print(f"  Embedding Dimension: {data['embedding_model']['dimension']}")
        print(f"  Chunk Size: {data['config']['chunk_size']}")
        print(f"  Use Reranker: {data['config']['use_reranker']}")
        return True
    except Exception as e:
        print(f"✗ Service info failed: {e}")
        return False


def test_index() -> bool:
    """Test document indexing"""
    print("\n" + "="*60)
    print("TEST: Document Indexing")
    print("="*60)

    success_count = 0

    for doc in SAMPLE_DOCS:
        try:
            payload = {
                "brand": TEST_BRAND,
                "doc_id": doc["doc_id"],
                "text": doc["text"],
                "metadata": {"source": "test_suite"}
            }

            response = requests.post(
                f"{BASE_URL}/api/v1/index",
                json=payload,
                timeout=30
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True

            print(f"✓ Indexed {doc['doc_id']}")
            print(f"  Chunks: {data['indexed']}")
            print(f"  Avg Chunk Size: {data['chunk_stats']['avgChunkSize']}")
            success_count += 1

        except Exception as e:
            print(f"✗ Failed to index {doc['doc_id']}: {e}")

    return success_count == len(SAMPLE_DOCS)


def test_search() -> bool:
    """Test semantic search"""
    print("\n" + "="*60)
    print("TEST: Semantic Search")
    print("="*60)

    queries = [
        "What is tryloop's mission?",
        "What are the core values?",
        "How does tryloop help creators?"
    ]

    success_count = 0

    for query in queries:
        try:
            payload = {
                "brand": TEST_BRAND,
                "query": query,
                "top_k": 3
            }

            response = requests.post(
                f"{BASE_URL}/api/v1/search",
                json=payload,
                timeout=30
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True

            print(f"\n✓ Query: '{query}'")
            print(f"  Results: {data['num_results']}")

            if data['num_results'] > 0:
                top_result = data['results'][0]
                print(f"  Top Match (score: {top_result['score']:.3f}):")
                print(f"    {top_result['text'][:100]}...")

            success_count += 1

        except Exception as e:
            print(f"✗ Search failed for '{query}': {e}")

    return success_count == len(queries)


def test_context() -> bool:
    """Test RAG context retrieval"""
    print("\n" + "="*60)
    print("TEST: RAG Context Retrieval")
    print("="*60)

    try:
        payload = {
            "brand": TEST_BRAND,
            "query": "What makes tryloop unique?",
            "max_tokens": 500
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/context",
            json=payload,
            timeout=30
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

        print(f"✓ Context retrieved")
        print(f"  Query: {data['query']}")
        print(f"  Token Count: {data['tokenCount']}")
        print(f"  Sources: {len(data['sources'])}")
        print(f"\n  Context Preview:")
        print(f"  {data['context'][:200]}...")

        return True

    except Exception as e:
        print(f"✗ Context retrieval failed: {e}")
        return False


def test_stats() -> bool:
    """Test statistics endpoint"""
    print("\n" + "="*60)
    print("TEST: Collection Statistics")
    print("="*60)

    try:
        payload = {"brand": TEST_BRAND}

        response = requests.post(
            f"{BASE_URL}/api/v1/stats",
            json=payload,
            timeout=10
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

        print(f"✓ Statistics retrieved")
        print(f"  Total Documents: {data.get('totalDocuments', 'N/A')}")
        print(f"  Total Chunks: {data.get('totalChunks', 'N/A')}")
        print(f"  Collection: {data.get('collectionName', 'N/A')}")

        return True

    except Exception as e:
        print(f"✗ Stats retrieval failed: {e}")
        return False


def test_delete() -> bool:
    """Test document deletion"""
    print("\n" + "="*60)
    print("TEST: Document Deletion")
    print("="*60)

    try:
        payload = {
            "brand": TEST_BRAND,
            "doc_id": "doc1"
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/delete",
            json=payload,
            timeout=10
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

        print(f"✓ Document deleted")
        print(f"  Doc ID: {data['doc_id']}")
        print(f"  Chunks Deleted: {data['deleted']}")

        return True

    except Exception as e:
        print(f"✗ Document deletion failed: {e}")
        return False


def test_cleanup() -> bool:
    """Test collection cleanup"""
    print("\n" + "="*60)
    print("TEST: Collection Cleanup")
    print("="*60)

    try:
        payload = {"brand": TEST_BRAND}

        response = requests.post(
            f"{BASE_URL}/api/v1/clear",
            json=payload,
            timeout=10
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

        print(f"✓ Collection cleared")
        print(f"  Chunks Deleted: {data.get('deleted', 0)}")

        return True

    except Exception as e:
        print(f"✗ Collection cleanup failed: {e}")
        return False


def wait_for_service(timeout: int = 60) -> bool:
    """Wait for service to be ready"""
    print("\n" + "="*60)
    print("Waiting for ORACLE service to start...")
    print("="*60)

    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{BASE_URL}/api/v1/health", timeout=2)
            if response.status_code == 200:
                elapsed = time.time() - start_time
                print(f"✓ Service ready after {elapsed:.1f}s")
                return True
        except:
            pass

        time.sleep(1)
        print(".", end="", flush=True)

    print(f"\n✗ Service did not start within {timeout}s")
    return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("ORACLE SERVICE TEST SUITE")
    print("="*60)

    # Wait for service
    if not wait_for_service():
        print("\n✗ Cannot connect to ORACLE service")
        print(f"  Ensure service is running at {BASE_URL}")
        return False

    # Run tests
    results = {
        "Health Check": test_health(),
        "Service Info": test_info(),
        "Document Indexing": test_index(),
        "Semantic Search": test_search(),
        "RAG Context": test_context(),
        "Statistics": test_stats(),
        "Document Deletion": test_delete(),
        "Collection Cleanup": test_cleanup()
    }

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(results.values())
    total = len(results)

    for test, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test}")

    print(f"\nTotal: {passed}/{total} tests passed ({100*passed//total}%)")
    print("="*60)

    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
