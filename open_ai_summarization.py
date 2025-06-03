import os
from openai import OpenAI

#together_ai_api_key = "928e43410ccacfa7a7dea90a0cdbb0a4b5cc12e9aa48b16b27b01db21f5f3081"
class OpenAISummarization:
    def __init__(self, api_key=None):
        # Initialize the OpenAI client with an API key
        api_key="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"
        
        self.api_key = api_key or os.getenv("OPEN_API_KEY")
        self.client = OpenAI(api_key=self.api_key)

    def generate_summary(self, input_text, max_tokens=512):
        # Create a summarization prompt
        summarization_prompt = f"Please summarize the following text: '{input_text}'"

        # Call the OpenAI API to generate a summary
        summarization_response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": summarization_prompt,
                }
            ],
            max_tokens=max_tokens,
        )

        # Extract the summary text from the API response
        summary = summarization_response.choices[0].message.content
        return summary