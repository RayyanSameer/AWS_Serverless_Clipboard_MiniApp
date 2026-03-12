# test_integration.py
import boto3
import json
import requests
import time

API_URL = 'https://vvuqy9b9ne.execute-api.ap-south-1.amazonaws.com'


def test_send_and_retrieve():
    payload = {
        "session_code": "TESTINTE",
        "ciphertext": "dGVzdGNpcGhlcnRleHQ=",
        "iv": "dGVzdGl2MTI="
    }

    # Send
    send_response = requests.post(f"{API_URL}/send", json=payload)
    assert send_response.status_code == 200

    # Retrieve
    get_response = requests.get(f"{API_URL}/get?session_code=TESTINTE")
    assert get_response.status_code == 200

    data = get_response.json()
    assert data['ciphertext'] == payload['ciphertext']
    assert data['iv'] == payload['iv']

def test_expired_code_returns_404():
    get_response = requests.get(f"{API_URL}/get?session_code=FAKECODE")
    assert get_response.status_code == 404