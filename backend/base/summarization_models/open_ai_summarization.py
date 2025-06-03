import os
from openai import OpenAI
import tiktoken 
from dotenv import load_dotenv
import re

class OpenAISummarization:
    def __init__(self, api_key=None):
        # Initialize the OpenAI client with an API key
    
        try:
            self.api_key = os.getenv("OPENAI_KEY")
            self.client = OpenAI(api_key=self.api_key)

            print("API Key:", self.api_key)
            print("OpenAI client successfully initialized")
        except Exception as e:
            print("Error initializing OpenAI client:", str(e))
            raise

    def ends_with_complete_sentence(self, text):
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())  
        last_sentence = sentences[-1] if sentences else ""  
        return bool(re.search(r"[.!?]$", last_sentence))  

    def generate_summary(self, model_name, prompt, full_text, context_window, max_tokens):

        if context_window is None or context_window == 0:
            context_window = 16384
            print("Using default context window: ", context_window)
        else:
            context_window = int(context_window)
            print("Context window in openAI: ", context_window)

        if max_tokens is None or max_tokens == 0:
            max_tokens = 256
            print("Using default max_tokens: ", max_tokens)
        else:
            max_tokens = int(max_tokens)


        try:
            tokenizer = tiktoken.encoding_for_model(model_name)
            print(f"Tokenizer for model {model_name} loaded successfully.")
        except Exception as e:
            print(f"Error loading tokenizer for model {model_name}: {e}")
            return


        summarization_prompt = prompt + ": " + full_text

        tokens = tokenizer.encode(summarization_prompt)
        input_token_count = len(tokens)

        # Check if the input exceeds the context window
        if input_token_count + max_tokens > context_window:
            print(f"Input tokens ({input_token_count}) + max_tokens ({max_tokens}) exceed context window ({context_window}). Adjusting...")
            
            max_input_tokens = context_window - max_tokens
            truncated_tokens = tokens[:max_input_tokens]
            truncated_text = tokenizer.decode(truncated_tokens)
        else:
            truncated_text = summarization_prompt

        print("Truncated text: ", truncated_text)


        try:
            summarization_response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": truncated_text,
                    }
                ],
                max_completion_tokens=max_tokens, 
            )

            summary = summarization_response.choices[0].message.content
            print("FINAL SUMMARY: ", summary)

            """""
            if not self.ends_with_complete_sentence(summary):
                print("Summary ended mid-sentence. Trimming to last complete sentence...")
                sentences = re.split(r'(?<=[.!?])\s+', summary.strip())
                last_complete_sentence = ' '.join(sentences[:-1]) 
                return last_complete_sentence
            """""
            
            return summary
        
        except Exception as e:
            print("Error during summary generation:", str(e))
            raise