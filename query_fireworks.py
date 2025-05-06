import requests
import json

url = "https://api.fireworks.ai/inference/v1/chat/completions"
payload = {
  "model": "accounts/dongyoon-kang-a70308/deployedModels/ft-avart-garde-v2-prompt-yytv2pwt",
  "max_tokens": 200,
#   "logprobs": 3,
  "top_p": 1,
  "top_k": 40,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "temperature": 0.6,
  "messages": [
    {
      "role": "user",
      "content": "Write me an Avant-Garde manifesto."
    }
  ]
}
headers = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": "Bearer fw_3ZSSPjwsMnXbzxaua7fFxrN6"
}

response = requests.request("POST", url, headers=headers, data=json.dumps(payload))

print(response.text)