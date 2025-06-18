import json
import time
import re
from typing import Dict, Any, Optional
import google.generativeai as genai
from google.genai import types
from app.config import settings
from app.utils.logger import logger
from app.utils.helpers import exponential_backoff_delay
from app.utils.exceptions import GeminiAPIError

# Global variable to store current API key
current_gemini_api_key = settings.GEMINI_API_KEY

def update_gemini_api_key(new_api_key: str) -> None:
    """Update Gemini API key at runtime"""
    global current_gemini_api_key
    current_gemini_api_key = new_api_key
    logger.info("Gemini API key updated successfully")

def extract_json_from_response(text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON object from text response"""
    start_patterns = [
        r'\{\s*"company_basic_info"',
        r'```json\s*\{',
        r'^\s*\{',
    ]
    
    for start_pattern in start_patterns:
        start_match = re.search(start_pattern, text, re.MULTILINE | re.IGNORECASE)
        if start_match:
            start_pos = start_match.start()
            if start_pattern == r'```json\s*\{':
                start_pos = text.find('{', start_match.start())
            
            # Find matching closing brace
            brace_count = 0
            end_pos = start_pos
            in_string = False
            escape_next = False
            
            for i, char in enumerate(text[start_pos:], start_pos):
                if escape_next:
                    escape_next = False
                    continue
                
                if char == '\\':
                    escape_next = True
                    continue
                
                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue
                
                if not in_string:
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_pos = i + 1
                            break
            
            if brace_count == 0:
                json_text = text[start_pos:end_pos]
                try:
                    json_data = json.loads(json_text)
                    if 'company_basic_info' in json_data:
                        return json_data
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON parse error: {e}")
                    # Try to fix common issues
                    try:
                        fixed_json = re.sub(r',(\s*[}\]])', r'\1', json_text)
                        json_data = json.loads(fixed_json)
                        if 'company_basic_info' in json_data:
                            return json_data
                    except:
                        continue
    
    return None

def generate_company_analysis(company_name: str, max_retries: int = 3) -> Dict[str, Any]:
    """Generate company analysis using Gemini API with retry logic"""
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Generating analysis for '{company_name}' (attempt {attempt + 1}/{max_retries})")
            
            client = genai.Client(api_key=current_gemini_api_key)
            model = "gemini-2.5-flash-preview-05-20"
            
            # Your existing prompt (truncated for brevity)
            prompt = f"""You are an expert Company Intelligence Analyst specializing in Private Equity and Lead Generation research. Your task is to conduct comprehensive company analysis and provide structured outputs in two distinct formats.

OUTPUT REQUIREMENTS:
PART 1: STRUCTURED DATA (JSON FORMAT)
Provide all data points from sections 1-13 in well-structured JSON format...

Now, please analyze {company_name} following this framework and provide both the structured JSON data and comprehensive reports."""

            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ]
            
            generate_content_config = types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                thinking_config=types.ThinkingConfig(thinking_budget=-1),
            )
            
            response = client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            )
            
            full_response = ""
            for chunk in response:
                full_response += chunk.text
            
            # Try to parse JSON
            try:
                json_data = json.loads(full_response)
                logger.info(f"Successfully generated analysis for '{company_name}'")
                return json_data
            except json.JSONDecodeError:
                logger.warning(f"Direct JSON parsing failed for '{company_name}', trying extraction...")
                json_data = extract_json_from_response(full_response)
                
                if json_data:
                    logger.info(f"Successfully extracted JSON for '{company_name}'")
                    return json_data
                
                if attempt < max_retries - 1:
                    delay = exponential_backoff_delay(attempt)
                    logger.warning(f"JSON extraction failed, retrying in {delay}s...")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"Failed to extract valid JSON for '{company_name}' after {max_retries} attempts")
                    raise GeminiAPIError(f"Could not extract valid analysis data for '{company_name}'")
                    
        except Exception as e:
            if attempt < max_retries - 1:
                delay = exponential_backoff_delay(attempt)
                logger.warning(f"Gemini API error on attempt {attempt + 1}: {e}, retrying in {delay}s...")
                time.sleep(delay)
            else:
                logger.error(f"Gemini API failed after {max_retries} attempts: {e}")
                raise GeminiAPIError(f"Unable to analyze company '{company_name}': {str(e)}")
    
    raise GeminiAPIError(f"Failed to generate analysis for '{company_name}' after {max_retries} attempts")