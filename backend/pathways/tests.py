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
    "mode": "STRICT",
    "userid": "1",
    "details": "",
    "chapters": "[{name: Chapter 1, learning goals: what is programming, ...}]"
}

# Make a POST request to the endpoint
response = requests.post(API_URL, json=data)

# Check the response from the API
if response.status_code == 200:
    print("Roadmap generated successfully:")
    print(json.dumps(response.json(), indent=4))
else:
    print(f"Error {response.status_code}: {response.text}")
import requests
import json

# # Replace with the actual URL of your Django server
# API_URL = 'http://localhost:8000/generate-quiz/'
#
# # Replace with valid IDs from your database
# payload = {
#     "module_id": 1,  # Example: module with ID 1
#     "user_id": 2     # Example: user (student) with ID 2
# }
#
# response = requests.post(API_URL, json=payload)
#
# if response.status_code == 201:
#     print("✅ Quiz generated successfully!")
#     print(json.dumps(response.json(), indent=4))
# else:
#     print(f"❌ Error {response.status_code}: {response.text}")
# import requests
# import json
#
# # Update this with your Django server URL
# API_URL = 'http://localhost:8000/module-assistant/'
#
# # Replace with an existing module ID from your DB
# payload = {
#     "module_id": 1,  # Example module ID
#     "message": "Can you help me understand what a function is in Python?"
# }
#
# response = requests.post(API_URL, json=payload)
#
# if response.status_code == 200:
#     print("✅ AI Assistant Reply:")
#     print(json.dumps(response.json(), indent=4))
# else:
#     print(f"❌ Error {response.status_code}: {response.text}")
