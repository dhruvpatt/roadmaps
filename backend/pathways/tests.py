import requests
import json

# Define the URL of your API endpoint
API_URL = 'http://localhost:8000/generate-roadmap/'  # Adjust this with the actual endpoint

# Prepare the data to send with the request (in the same format your API expects)
data = {
    "topic": "Python Programming",
    "title": "Intro to Python",
    "learning_goals": ["Understand Python basics", "Write Python scripts"],
    "grade": "9",
    "mode": "STRICT"
}

# Make a POST request to the endpoint
response = requests.post(API_URL, json=data)

# Check the response from the API
if response.status_code == 200:
    print("Roadmap generated successfully:")
    print(json.dumps(response.json(), indent=4))
else:
    print(f"Error {response.status_code}: {response.text}")
