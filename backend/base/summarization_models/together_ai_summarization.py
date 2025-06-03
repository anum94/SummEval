import os
from together import Together
from transformers import AutoTokenizer, LlamaTokenizerFast
from tqdm import tqdm
import re
from dotenv import load_dotenv

class TogetherAISummarization:
    def __init__(self, api_key=None):

        self.api_key = os.getenv("TOGETHERAI_KEY")
        self.client = Together(api_key=self.api_key)
    
    def define_model_name(self, model_name):
        if model_name == "llama3.2 3B":
            model = "meta-llama/Llama-3.2-3B-Instruct-Turbo"

        elif model_name == "Mistral 7b":
            model = "mistralai/Mistral-7B-Instruct-v0.1"

        elif model_name == "llama3.1 8B":
            model = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
        
        else: 
            model = model_name

        print("Defined model name is: " + model)
        return model
    
        
    def ends_with_complete_sentence(self, text):
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())  # Split based on sentence-ending punctuation
        last_sentence = sentences[-1] if sentences else ""  # Get the last sentence safely
        return bool(re.search(r"[.!?]$", last_sentence))  

        
    def generate_summary(self, choosen_model_name, prompt, input_text, context_window, max_tokens):
        print("Generate summary in TogetherAI part is activated")
        print("Context window in togetherAI: ", context_window)
        print("max_tokens in togetherAI: ", max_tokens)
        context_window, max_tokens = int(context_window), int(max_tokens)

        if context_window is None or context_window == 0:
            context_window = 16384
            print("Using default context window: ", context_window)
        else:
            context_window = int(context_window)
            print("Context window in TogetherAI: ", context_window)

        if max_tokens is None or max_tokens == 0:
            max_tokens = 256 
            print("Using default max_tokens: ", max_tokens)
        else:
            max_tokens = int(max_tokens)
            
    
        # Load the tokenizer dynamically based on the model name
        model_name = self.define_model_name(choosen_model_name)

        print(f"Loading tokenizer for model: {model_name}")
        
        try:
            tokenizer = LlamaTokenizerFast.from_pretrained("hf-internal-testing/llama-tokenizer")
            print(f"Tokenizer for model: {model_name} loaded successfully.")
        except Exception as e:
            print(f"Error loading tokenizer for model {model_name}: {e}")
            return

        summarization_prompt = prompt + ": " + input_text

        tokens = tokenizer.encode(summarization_prompt)
        input_token_count = len(tokens)

        print(f"Input text contains {input_token_count} tokens.")
        if input_token_count + max_tokens > context_window:
            print(f"Input tokens ({input_token_count}) + max_tokens ({max_tokens}) exceed context window ({context_window}). Adjusting...")
        
            max_input_tokens = context_window - max_tokens
            truncated_tokens = tokens[:max_input_tokens]
            truncated_text = tokenizer.decode(truncated_tokens, skip_special_tokens=True)
            

        else:
            print(f"Input text in else part {input_text}.")
            truncated_text = summarization_prompt

        print("Truncated text: ", truncated_text)

        try:
            summarization_response = self.client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": truncated_text}],
                max_tokens=max_tokens,  # Control the length of the generated summary
                temperature=0.7,
                top_p=0.9,
                stream=False, 
            )

            # Access the response directly
            summary = summarization_response.choices[0].message.content
            print("\nFINAL SUMMARY: ", summary)

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