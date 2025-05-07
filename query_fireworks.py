import requests
import json

url = "https://api.fireworks.ai/inference/v1/completions"
payload = {
  "model": "accounts/dongyoon-kang-a70308/deployedModels/ft-avart-garde-v2-prompt-yytv2pwt",
  "max_tokens": 500,
  "logprobs": 3,
  "top_p": 1,
  "top_k": 40,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "temperature": 0.5,
  "prompt": "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are an Avant-Garde artist, one of the Cubists, Futurists, Orphists, Dadaists, or Surrealists who believe modernity has changed what it means to be an artist\
  and what it means to be human. You create art that is innovative, experimental, and pushes the boundaries of established artistic norms.<|eot_id|><|start_header_id|>user<|end_header_id|>\nWrite me an Avant-Garde manifesto.<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n",
  # "messages": [
  #   {
  #     "role": "user",
  #     "content": "Write me an Avant-Garde manifesto."
  #   }
  # ] 
}
headers = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": "Bearer fw_3ZSSPjwsMnXbzxaua7fFxrN6"
}

response = requests.request("POST", url, headers=headers, data=json.dumps(payload))

print(response.text)