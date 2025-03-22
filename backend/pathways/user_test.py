# import json
#
# import requests
#
# # Define the URL of the API endpoint (make sure your Django server is running)
# url = 'http://127.0.0.1:8000/api/create-user/'  # Adjust to your local or deployed server's URL
#
# # Sample user data to send in the POST request
# user_data = {
#     "email": "will@mail.com",
#     "password": "password1234",
#     "role": "student",
# }
#
# # Send a POST request to the create_user endpoint
# response = requests.post(url, data=json.dumps(user_data), headers={'Content-Type': 'application/json'})
#
# # Print the status code and the response data
# print("Status Code:", response.status_code)
# print("Response Data:", response.json())
#
# # Check if the response was successful (201 Created)
# if response.status_code == 201:
#     print("User created successfully!")
# else:
#     print("Failed to create user.")
#     print("Error:", response.json())


# import requests
# import json
#
# API_URL = 'http://localhost:8000/api/student-analytics/1/'  # Replace 1 with the actual student user ID
#
# response = requests.get(API_URL)
#
# if response.status_code == 200:
#     print("✅ Student Analytics:")
#     print(json.dumps(response.json(), indent=4))
# else:
#     print(f"❌ Error {response.status_code}: {response.text}")


import requests
import json

API_URL = 'http://localhost:8000/api/teacher-analytics/2/'  # Replace 2 with the actual teacher user ID

response = requests.get(API_URL)

if response.status_code == 200:
    print("✅ Teacher Analytics:")
    print(json.dumps(response.json(), indent=4))
else:
    print(f"❌ Error {response.status_code}: {response.text}")
