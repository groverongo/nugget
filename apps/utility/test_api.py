import requests
import json
import time
import subprocess
import sys

# Start the server in background
print("Starting FastAPI server...")
server = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="/home/groverongo/Documents/Personal/nugget/python",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait for server to start
time.sleep(3)

try:
    # Test data with sample coordinates
    payload = {
        "data": [
            [25.2, 40.1], [26.3, 41.5], [24.8, 39.2],
            [70.1, 60.2], [69.5, 61.3], [71.2, 59.8],
            [50.0, 20.1], [50.5, 19.8], [49.8, 20.5]
        ],
        "bins": 50,
        "title": "Test Heatmap"
    }

    print("Sending POST request to /heatmap endpoint...")
    response = requests.post(
        "http://127.0.0.1:8000/heatmap",
        json=payload,
        timeout=30
    )

    print(f"Response Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")

    if response.status_code == 200:
        # Verify it's actually PNG data
        if response.content[:8] == b'\x89PNG\r\n\x1a\n':
            print("✓ Successfully received valid PNG image!")
            print(f"Image size: {len(response.content)} bytes")

            # Save the image for inspection
            with open("/home/groverongo/Documents/Personal/nugget/python/test_output.png", "wb") as f:
                f.write(response.content)
            print("✓ Image saved to test_output.png")
        else:
            print("✗ Response is not a valid PNG file")
            print(f"First 100 bytes: {response.content[:100]}")
    else:
        print(f"✗ Request failed with status {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"✗ Error during test: {e}")
finally:
    # Stop the server
    print("\nStopping server...")
    server.terminate()
    server.wait()
