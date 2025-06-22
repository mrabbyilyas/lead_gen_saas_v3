#!/usr/bin/env python3
"""Test script for Gemini API connectivity"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.gemini_client import generate_company_analysis
from app.config import settings
import json

def test_gemini_api():
    """Test Gemini API with a simple company"""
    
    print("=== Gemini API Test ===")
    print(f"API Key (first 10 chars): {settings.GEMINI_API_KEY[:10]}...")
    print(f"API Key length: {len(settings.GEMINI_API_KEY)}")
    
    if not settings.GEMINI_API_KEY:
        print("❌ ERROR: GEMINI_API_KEY is not set!")
        return False
    
    try:
        print("\n🔄 Testing with 'Apple Inc'...")
        result = generate_company_analysis("Tesla")
        
        print("✅ SUCCESS: Gemini API call successful!")
        print(f"Response type: {type(result)}")
        print(f"Response keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        # Save result to file for inspection
        with open("gemini_test_result.json", "w") as f:
            json.dump(result, f, indent=2, default=str)
        print("📁 Full result saved to 'gemini_test_result.json'")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        
        # Additional debugging
        if "API key" in str(e).lower():
            print("💡 This looks like an API key issue. Check:")
            print("   1. Is your API key correct?")
            print("   2. Is the API key enabled for Gemini AI?")
            print("   3. Do you have quota/credits available?")
        
        return False

if __name__ == "__main__":
    success = test_gemini_api()
    if not success:
        print("\n🔧 Troubleshooting steps:")
        print("1. Check your .env file has GEMINI_API_KEY=your_actual_key")
        print("2. Verify the API key at https://aistudio.google.com/app/apikey")
        print("3. Make sure the API key has proper permissions")
        print("4. Check if you have available quota")
        sys.exit(1)
    else:
        print("\n🎉 Gemini API is working correctly!")