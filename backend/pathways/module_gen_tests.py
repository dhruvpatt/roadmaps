import requests
import json

# Replace this with the actual URL of your module content generation endpoint
API_URL = 'http://localhost:8000/generate-module/'

# Replace with actual values from your test DB
data = {
    "module_id": 1,
    "user_id": 1
}

# Make a POST request to the endpoint
response = requests.post(API_URL, json=data)

# Check the response from the API
if response.status_code == 201:
    print("Module content generated successfully:")
    print(json.dumps(response.json(), indent=4))
else:
    print(f"Error {response.status_code}: {response.text}")
