import json
import time
import re
import json
from typing import Dict, Any, Optional
from google import genai
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
            model = "gemini-2.5-flash"
            
            # Comprehensive prompt from Jupyter notebook
            contents = [
                genai.types.Content(
                    role="user",
                    parts=[
                        genai.types.Part.from_text(text=f"""You are an expert Company Intelligence Analyst specializing in Private Equity and Lead Generation research. Your task is to conduct comprehensive company analysis and provide structured outputs in two distinct formats.

OUTPUT REQUIREMENTS:
PART 1: STRUCTURED DATA (JSON FORMAT)
Provide all data points from sections 1-13 in well-structured JSON format. Use the following structure:

json
{{
  "company_basic_info": {{
    "company_legal_name": "string",
    "company_name": "string",
    "trade_name_dba": "string",
    "incorporation_date": "YYYY-MM-DD",
    "company_age": 0,
    "company_registration_number": "string",
    "tax_id_ein": "string",
    "website_url": "string",
    "primary_website_url": "string",
    "email_domain": "string",
    "contact_phone": "string",
    "contact_email": "string",
    "industry_primary": "string",
    "industry_subsector": "string",
    "industry_naics_code": "string",
    "industry_sic_code": "string",
    "business_description": "string",
    "business_model_type": "category",
    "company_stage": "category",
    "headquarters_location": "string",
    "headquarters_full_address": "string",
    "headquarters_country": "string",
    "headquarters_state_province": "string",
    "headquarters_city": "string",
    "headquarters_postal_code": "string",
    "number_of_office_locations": 0,
    "office_locations_list": ["array"],
    "linkedin_company_url": "string",
    "twitter_handle": "string",
    "facebook_page": "string",
    "instagram_handle": "string",
    "revenue_estimate": "string",
    "employee_count_estimate": "string",
    "total_full_time_employees": 0,
    "total_part_time_employees": 0,
    "total_contractors": 0
  }},
  "financial_metrics": {{
    "revenue_data": {{
      "current_year_revenue": 0,
      "previous_year_revenue": 0,
      "revenue_2_years_ago": 0,
      "revenue_3_years_ago": 0,
      "revenue_4_years_ago": 0,
      "revenue_5_years_ago": 0,
      "revenue_cagr_3_year": 0.0,
      "revenue_cagr_5_year": 0.0,
      "q1_revenue_current_year": 0,
      "q2_revenue_current_year": 0,
      "q3_revenue_current_year": 0,
      "q4_revenue_current_year": 0,
      "revenue_seasonality_index": 0,
      "recurring_revenue_percentage": 0.0,
      "one_time_revenue_percentage": 0.0,
      "arr": 0,
      "mrr": 0,
      "average_contract_value": 0,
      "revenue_by_product_line_1": {{"amount": 0, "percentage": 0.0}},
      "revenue_by_geography_domestic": {{"amount": 0, "percentage": 0.0}},
      "revenue_by_geography_international": {{"amount": 0, "percentage": 0.0}},
      "revenue_concentration_risk": "category"
    }},
    "profitability_metrics": {{
      "gross_revenue": 0,
      "cogs": 0,
      "gross_profit": 0,
      "gross_profit_margin": 0.0,
      "operating_revenue": 0,
      "operating_expenses": 0,
      "operating_income": 0,
      "operating_margin": 0.0,
      "ebitda": 0,
      "ebitda_margin": 0.0,
      "ebit": 0,
      "ebit_margin": 0.0,
      "net_income": 0,
      "net_profit_margin": 0.0,
      "free_cash_flow": 0,
      "free_cash_flow_margin": 0.0
    }},
    "balance_sheet": {{
      "total_assets": 0,
      "current_assets": 0,
      "total_liabilities": 0,
      "current_liabilities": 0,
      "total_equity": 0,
      "cash_and_equivalents": 0,
      "total_debt": 0,
      "debt_to_equity_ratio": 0.0,
      "current_ratio": 0.0,
      "working_capital": 0,
      "cash_runway_months": 0
    }},
    "unit_economics": {{
      "cac": 0,
      "ltv": 0,
      "ltv_cac_ratio": 0.0,
      "cac_payback_months": 0,
      "monthly_churn_rate": 0.0,
      "annual_churn_rate": 0.0,
      "nrr": 0.0,
      "grr": 0.0,
      "arpu": 0,
      "arpa": 0
    }}
  }},
  "valuation_investment": {{
    "valuation_metrics": {{
      "current_valuation": 0,
      "enterprise_value": 0,
      "market_cap": 0,
      "ev_revenue_multiple": 0.0,
      "ev_ebitda_multiple": 0.0,
      "pe_ratio": 0.0
    }},
    "funding_history": {{
      "investment_history": "category",
      "total_funding_raised": 0,
      "number_of_funding_rounds": 0,
      "last_funding_round_type": "category",
      "last_funding_amount": 0,
      "last_funding_date": "YYYY-MM-DD",
      "last_funding_lead_investor": "string"
    }},
    "ownership_structure": {{
      "founder_ownership_percentage": 0.0,
      "management_ownership": 0.0,
      "employee_stock_pool": 0.0,
      "investor_ownership": 0.0,
      "number_of_shareholders": 0
    }}
  }},
  "leadership_management": {{
    "executives": {{
      "decision_maker_name": "string",
      "decision_maker_title": "string",
      "ceo_name": "string",
      "ceo_age": 0,
      "ceo_background": "string",
      "ceo_tenure_years": 0.0,
      "ceo_linkedin": "string",
      "cfo_name": "string",
      "cto_name": "string"
    }},
    "founders": {{
      "number_of_founders": 0,
      "founder_1_name": "string",
      "founder_1_role": "string",
      "founder_1_equity": 0.0,
      "founder_1_active": true
    }},
    "team_metrics": {{
      "management_stability": "category",
      "employee_growth_rate_1_year": 0.0,
      "engineering_team_size": 0,
      "sales_team_size": 0,
      "average_tenure_years": 0.0,
      "turnover_rate": 0.0,
      "glassdoor_rating": 0.0,
      "glassdoor_reviews": 0
    }}
  }},
  "market_competition": {{
    "market_data": {{
      "market_position": "category",
      "tam": 0,
      "sam": 0,
      "market_growth_rate": 0.0,
      "current_market_share": 0.0,
      "market_share_rank": 0
    }},
    "competitive_analysis": {{
      "competitive_advantages": ["array"],
      "potential_challenges": ["array"],
      "direct_competitors": [
        {{"name": "string", "market_share": 0.0, "revenue": 0}}
      ],
      "competitive_position": "category",
      "barriers_to_entry": 0,
      "moat_strength": 0
    }}
  }},
  "customer_sales": {{
    "customer_base": {{
      "total_customers": 0,
      "customer_growth_rate": 0.0,
      "customer_retention_rate": 0.0,
      "nps_score": 0,
      "csat_score": 0.0
    }},
    "customer_concentration": {{
      "top_customer_revenue_percent": 0.0,
      "top_10_customers_revenue_percent": 0.0,
      "customer_concentration_risk": "category"
    }},
    "sales_metrics": {{
      "average_sales_cycle_days": 0,
      "conversion_rate": 0.0,
      "average_deal_size": 0,
      "win_rate": 0.0
    }}
  }},
  "technology_operations": {{
    "technology_stack": {{
      "technology_adoption_level": "category",
      "primary_languages": ["array"],
      "cloud_provider": "category",
      "crm_system": "string",
      "erp_system": "string"
    }},
    "infrastructure": {{
      "infrastructure_type": "category",
      "cloud_spend_monthly": 0,
      "system_uptime": 0.0,
      "scalability_score": 0
    }},
    "rd_innovation": {{
      "rd_team_size": 0,
      "rd_spending": 0,
      "rd_percent_revenue": 0.0,
      "patents_held": 0,
      "innovation_score": 0
    }}
  }},
  "legal_compliance": {{
    "corporate_structure": {{
      "legal_entity_type": "category",
      "state_incorporation": "string",
      "regulatory_compliance_status": "category"
    }},
    "litigation": {{
      "active_cases": 0,
      "settlement_amount_5_years": 0
    }},
    "intellectual_property": {{
      "patent_portfolio_size": 0,
      "trademark_registrations": 0,
      "ip_valuation": 0
    }}
  }},
  "esg_risk": {{
    "environmental": {{
      "esg_alignment": "category",
      "carbon_footprint": 0,
      "sustainability_score": 0
    }},
    "social": {{
      "employee_satisfaction": 0,
      "diversity_score": 0,
      "community_investment": 0
    }},
    "governance": {{
      "board_independence": 0.0,
      "governance_score": 0
    }},
    "risk_assessment": {{
      "overall_risk_level": "category",
      "financial_risk": "category",
      "market_risk": "category",
      "operational_risk": "category"
    }}
  }},
  "growth_outlook": {{
    "growth_strategy": {{
      "primary_strategy": "category",
      "geographic_expansion_potential": "category",
      "acquisition_strategy": true,
      "partnership_strategy": true
    }},
    "exit_strategy": {{
      "expected_exit_strategy": "category",
      "ipo_readiness_score": 0,
      "exit_timeline_years": 0
    }}
  }},
  "acquisition_scoring": {{
    "pe_scoring": {{
      "acquisition_score": 0.0,
      "overall_opportunity_score": 0.0,
      "exit_readiness_level": "category",
      "owner_age_indicators": "category",
      "succession_planning_signals": true,
      "acquisition_complexity": "category",
      "revenue_range_fit": true,
      "company_age_fit": true
    }},
    "acquisition_analysis": {{
      "acquisition_barriers": ["array"],
      "synergy_opportunities": "string",
      "industry_reputation": "category",
      "deal_timeline_estimate": "category",
      "due_diligence_priorities": ["array"]
    }}
  }},
  "business_intelligence": {{
    "market_intelligence": {{
      "industry_consolidation_trend": "category",
      "digital_disruption_risk": "category",
      "recent_news_summary": "string",
      "growth_signals": ["array"],
      "financial_health_indicators": ["array"]
    }},
    "lead_gen_intelligence": {{
      "social_media_activity": "category",
      "website_quality_score": 0,
      "communication_preference": "category",
      "marketing_sophistication": "category",
      "recommended_approach": "category"
    }}
  }},
  "data_metadata": {{
    "sources": {{
      "primary_sources": ["array"],
      "secondary_sources": ["array"],
      "interview_sources": ["array"]
    }},
    "quality": {{
      "data_collection_date": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD",
      "confidence_level": 0,
      "verification_status": "category",
      "data_gaps": ["array"]
    }}
  }}
}}

PART 2: COMPREHENSIVE REPORTS (RICH TEXT FORMAT)
After the JSON data, provide two detailed narrative reports in rich text format:

🏢 PRIVATE EQUITY INVESTMENT ANALYSIS REPORT
Write a comprehensive investment analysis report that includes:

EXECUTIVE SUMMARY
- Investment thesis in 2-3 sentences
- Key financial highlights
- Overall recommendation (Pursue/Monitor/Pass)
- Expected returns and timeline

INVESTMENT OPPORTUNITY ASSESSMENT
- Financial attractiveness analysis
- Market position and competitive advantages
- Management team evaluation
- Growth potential assessment

ACQUISITION READINESS ANALYSIS
- Owner motivation and exit readiness
- Deal complexity assessment
- Valuation framework
- Acquisition barriers and mitigation

VALUE CREATION OPPORTUNITIES
- Revenue growth initiatives with quantified impact
- Operational efficiency improvements
- Strategic initiatives and add-on potential
- Technology modernization opportunities

RISK ASSESSMENT & MITIGATION
- High, medium, and low priority risks
- Mitigation strategies for each risk
- Key monitoring indicators
- Regulatory and market risks

DEAL EXECUTION STRATEGY
- Recommended approach and timing
- Key stakeholders and decision makers
- Due diligence priorities
- Timeline and next steps

📈 LEAD GENERATION ANALYSIS REPORT
Write a comprehensive lead generation report that includes:

EXECUTIVE SUMMARY
- Lead quality assessment
- Primary opportunity description
- Recommended action and timeline
- Success probability estimate

LEAD QUALIFICATION ANALYSIS
- ICP fit assessment
- Business needs evaluation
- Buying signals and timing indicators
- Budget and authority assessment

CONTACT STRATEGY & APPROACH
- Decision maker profiling
- Stakeholder mapping
- Optimal outreach methodology
- Value proposition customization

COMPETITIVE LANDSCAPE & POSITIONING
- Current vendor relationships
- Competitive differentiation strategy
- Pricing and positioning approach
- Proof points and case studies

ENGAGEMENT ROADMAP
- Phase-by-phase engagement plan
- Key activities and milestones
- Success metrics and KPIs
- Resource requirements

RISK FACTORS & OBJECTION HANDLING
- Potential objections and responses
- Competitive risks and mitigation
- Internal challenges and solutions
- Contingency planning

NEXT STEPS & ACCOUNTABILITY
- Immediate actions (next 48 hours)
- Short-term goals (next 2 weeks)
- Long-term objectives (next quarter)
- Success metrics and review schedule

ANALYSIS GUIDELINES:
- Be Specific: Use actual data points when available, estimates when necessary
- Quantify Impact: Provide numerical ranges for opportunities and risks
- Actionable Insights: Every recommendation should have clear next steps
- Risk-Balanced: Present both opportunities and challenges objectively
- Timeline-Focused: Include realistic timelines for all recommendations
- Stakeholder-Aware: Consider perspectives of both PE professionals and lead gen teams

RESEARCH DEPTH:
- Conduct thorough market research if needed
- Cross-reference multiple data sources
- Validate assumptions with industry benchmarks
- Include recent news and developments
- Consider macro-economic factors

OUTPUT QUALITY:
- Ensure JSON is properly formatted and complete
- Write reports in professional, executive-ready language
- Include specific metrics and benchmarks
- Provide clear recommendations with reasoning
- Structure content for easy scanning and decision-making

Now, please analyze {company_name} following this framework and provide both the structured JSON data and comprehensive reports."""),
                    ],
                ),
                genai.types.Content(
                    role="model",
                    parts=[
                        genai.types.Part.from_text(text="""**Begin Constructing Analysis**

I've initiated the company analysis for "Midwest Technology Partners." My initial focus is gathering the specific data elements required for the JSON structure. I'm prioritizing financial metrics and company details, recognizing this is the bedrock for the more expansive narrative reports.


**Developing the Data Acquisition Strategy**

I've formulated a comprehensive plan for acquiring the necessary data. My initial focus will be on broad searches to gather foundational details. I'll then delve into company basics, which is likely the easiest part. After that, I'll tackle the challenging task of financial metrics, especially for this private entity. Finding valuation and investment information will be the next critical step.


**Planning Data Collection**

I'm now refining the data acquisition strategy. I've broken down the project into 14 distinct data-gathering areas, including basic company information, financial metrics (a key challenge for private entities), valuation & investment data, leadership profiles, market analysis, customer insights, tech stack details, legal/compliance considerations, ESG factors, growth outlook, acquisition scoring, business intelligence summaries, and data metadata. I'm focusing initial efforts on wide Google searches to establish a base, then moving to more detailed searches. I've also added a constraint checklist and confidence scoring.


**Expanding Data Gathering Scope**

I'm now expanding my data acquisition strategy. While the initial broad search yielded foundational details, the challenge of financial and operational specifics for a private company like "Midwest Technology Partners" has prompted a shift. My confidence score has been slightly reduced; I now anticipate the need for more in-depth searches and potentially the reliance on industry averages/estimates, duly noted as such, for certain metrics.


**Commencing Data Extraction**

I've begun data extraction for "Midwest Technology Partners," starting with the initial broad searches. My focus is on determining the precise entity and gathering foundational details to feed into the JSON structure. Given the generic company name, I'm prioritizing results clearly indicating a technology focus. The objective is now to accurately identify and extract basic company information for the JSON. The overall confidence remains at 4/5, recognizing the challenges inherent in private company data.


**Narrowing Down Entities**

I'm currently focused on the search results for "Midwest Technology Partners". I've observed several similar names, but I'm homing in on "Midwest Technology Partnership, LLC" as the most likely match for a technology services or staffing company, which aligns well with the initial prompt. This seems promising, but I'll continue to explore other possibilities.


**Focusing on MTP**

I've significantly narrowed the search to "Midwest Technology Partnership, LLC" (MTP).  Its services, location, and founder details align with the initial request. My next steps involve validating the information and gathering more data, particularly on its revenue and financial health, and reconciling employee count discrepancies before diving deeper into MTP's operations.


**Analyzing Primary Matches**

I'm now deep into assessing the viability of "Midwest Technology Partnership, LLC" (MTP). My research reveals a clear match with the initial query. I've compiled crucial data points, like its Indianapolis headquarters, Rob Vanator's leadership, and its 2002 founding. Its staffing and IT services offerings align perfectly with the prompt. Next, I'm working to verify the employee count disparity and delve deeper into their financial information to determine suitability.


**Prioritizing Key Data**

I've clarified the primary target as "Midwest Technology Partnership, LLC" (MTP). I've gathered core data, highlighting its Indianapolis location, services like staffing and web development, and its 2002 inception. Key tasks now involve verifying employee numbers (PitchBook's 12 versus another source's 3) and researching its financial profile to gauge its potential for the analysis.


**Validating Company Details**

I've completed the initial data gathering phase. I've compiled essential details for "Midwest Technology Partnership, LLC" including its legal and trade names, website, and location. I am focusing on verifying the employee count and gathering more precise financial information to improve the initial JSON data.


**Verifying Data Points**

I'm now in the process of finalizing the data. I'm actively verifying the founding date, business description, and key contact details for "Midwest Technology Partnership, LLC".  I'm also working to find public LinkedIn and Twitter links to increase the completeness of the initial data. My top priority is ensuring the accuracy of the employee count, which I'll cross-reference with multiple sources.


**Validating Data Collection**

I'm now in the process of confirming the gathered information for "Midwest Technology Partnership, LLC".  I have validated that Rob Vanator is indeed the President, and the address and contact details align with the company's website. I'm focusing on employee counts. It seems the data aligns well, and I will now continue on to other crucial data points.


**Validating Data Collection**

I'm now in the process of finalizing the data for "Midwest Technology Partnership, LLC". I've compiled critical details like its legal name, website, and founding date. I'm prioritizing validating the employee count discrepancy, as well as refining the NAICS codes. My next steps involve determining if further data is available through public and paid datasets.


**Verifying Key Attributes**

I'm now in the process of finalizing and validating data collection. I've compiled crucial details for "Midwest Technology Partnership, LLC", focusing on its founding date, services, and key contact. I'm focusing on the employee count discrepancy, as well as refining the NAICS codes. My goal is to ensure data accuracy and completeness.


**Confirming Key Details**

I'm now in the process of finalizing and confirming key details for "Midwest Technology Partnership, LLC". I've compiled essential information, including its website, headquarters address, and founding date. I'm focusing on validating the employee count discrepancy, as well as refining the NAICS codes. My goal is to ensure data accuracy and completeness.


**Confirming Key Attributes**

I'm currently finalizing data collection for "Midwest Technology Partnership, LLC".  I've verified the website and primary contact details. My next steps involve confirming the employee count and exploring if any recent public activity, such as news or social media, may be available.


**Verifying Key Attributes**

I'm presently confirming the founding date and business description for "Midwest Technology Partnership, LLC", cross-referencing against multiple sources. I'm prioritizing accuracy in these details. I am also searching for the company on LinkedIn and Twitter.


**Verifying Data Integrity**

I'm now cross-referencing information to ensure accuracy. I've located a LinkedIn profile for "Midwest Technology Partnership, LLC". The website and address match, but the employee count still differs. The discrepancies demand further investigation.


**Analyzing Company Data**

I've successfully identified the legal name for "Midwest Technology Partnership, LLC" as per the initial data. I am now proceeding with the remaining information needed for the JSON, focusing on pending items. My goal is to organize this information clearly and concisely.


**Progressing the JSON Structure**

I've completed the initial data gathering for "Midwest Technology Partnership, LLC". The incorporation date and industry NAICS code are now confirmed. I've also clarified the business description and model type, and I've marked the company as revenue-generating. Now I'm shifting focus to ensuring the JSON structure reflects this comprehensive information effectively.


**Confirming Key Details**

I have a much clearer picture of "Midwest Technology Partnership, LLC" now. Confirmed details include the legal name, trade name, website, phone number, and a more specific NAICS code (541612). The business model, stage, and full address are also set. Regarding employee count, I'm noting the discrepancies between sources and will reflect a range.


**Consolidating Data and Structuring**

I've completed my initial data collection for "Midwest Technology Partnership, LLC." I have a good handle on its key attributes, including legal and trade names, website, and NAICS code. I've also confirmed its business model, stage, and full address. Employee count requires clarification. My next steps are organizing the data logically and crafting a comprehensive JSON output. I'm focusing on discrepancies and refining estimates for accuracy.


**Organizing the Information**

I've gathered a substantial amount of information for "Midwest Technology Partnership, LLC." I have incorporated all the necessary details. I'm focusing now on properly incorporating all of the technology expertise and other company data in a structured, clear format for the JSON output. Also, I will incorporate  the employee count discrepancy  with the correct formatting.


**Gathering Remaining Details**

I have a fairly comprehensive overview of "Midwest Technology Partnership, LLC." I have incorporated the relevant website and contact information. Employee count discrepancies have been addressed, and I'm currently focused on determining a reasonable revenue estimate and refining the technology expertise list. I'm also attempting to locate the social media profiles.


**Identifying Company Details**

I've successfully pinpointed key details for Midwest Technology Partnership, LLC (mtpindy.com). I've confirmed their legal name and discovered their website and basic description. I can now confidently fill in those sections. Other information, like the company's address, is still an estimate or unavailable. I'm focusing on acquiring more company-specific details.


**Gathering More Data Points**

My focus has shifted to enriching the "Midwest Technology Partnership, LLC" (mtpindy.com) profile. I've populated several fields with verified data, including legal name, website details, contact information (with a placeholder email), and primary NAICS codes. My next steps involve refining industry classification and building out a description using data from a variety of sources. I am also currently working on a method for the user to be able to add these details themselves.


**Populating Remaining Fields**

I'm making progress in filling out the remaining fields for "Midwest Technology Partnership, LLC". I've finalized the primary industry as "Staffing and Recruiting" and incorporated their detailed business description. I have added the headquarters location, address, and contact information. Now, I'm working to confirm their LinkedIn profile and other social media presence. I'm focusing on ensuring data accuracy across all available sources.


**Updating Data Points**

My focus has shifted to the details of "Midwest Technology Partnership, LLC" (mtpindy.com). I've successfully gathered and organized data, confirming legal and trade names, along with an estimated incorporation date, website details, and contact information. Key details such as industry, description, business model, and location have also been populated. However, direct company social media links remain elusive. I've also estimated the employee count at 12 and placed their revenue "Under 1 Million" with an estimated value of $750,000.


**Analyzing Data Completeness**

I'm now focusing on filling in the remaining gaps for Midwest Technology Partnership, LLC. I've populated the primary and sub-industry fields, along with contact details and address information. I've also added estimates for employee count and revenue, supported by the data I have. I've categorized them as "Generating Revenue" and populated the funding and last funding round information. I'm focusing on their social media pages but I will now provide these details as N/A, since they are not available.


**Confirming Company Status**

I've finalized all the company details for "Midwest Technology Partnership, LLC" (mtpindy.com). I've confirmed their legal and trade names, website, contact info, industry classification, business description, and location. I also have an estimated employee count and revenue estimate, along with their funding information. Social media links for the company remain unavailable. Now I'll proceed with creating the final structure and reports.


"""),
                        genai.types.Part.from_text(text="""```json
{
  "company_basic_info": {
    "company_legal_name": "Midwest Technology Partnership, LLC",
    "company_name": "Midwest Technology Partnership",
    "trade_name_dba": "MTP",
    "incorporation_date": "2002-01-01",
    "company_age": 23,
    "company_registration_number": "N/A",
    "tax_id_ein": "N/A",
    "website_url": "https://www.mtpindy.com",
    "primary_website_url": "https://www.mtpindy.com",
    "email_domain": "mtpindy.com",
    "contact_phone": "+1 317-426-4325",
    "contact_email": "info@mtpindy.com",
    "industry_primary": "Staffing and Recruiting",
    "industry_subsector": "IT Staffing, Web Development, Application Development",
    "industry_naics_code": "541612",
    "industry_sic_code": "N/A",
    "business_description": "Provider of staffing, web development, internet marketing and application development services. The company specializes in placing IT executives and enterprise-level professionals for Fortune 1000 companies spanning the US, Western Europe and Asia.",
    "business_model_type": "B2B Services",
    "company_stage": "Generating Revenue",
    "headquarters_location": "Indianapolis, IN",
    "headquarters_full_address": "25 East 40th, Suite 1K, Indianapolis, IN 46205, United States",
    "headquarters_country": "United States",
    "headquarters_state_province": "IN",
    "headquarters_city": "Indianapolis",
    "headquarters_postal_code": "46205",
    "number_of_office_locations": 1,
    "office_locations_list": ["25 East 40th, Suite 1K, Indianapolis, IN 46205, United States"],
    "linkedin_company_url": "",
    "twitter_handle": "",
    "facebook_page": "",
    "instagram_handle": "",
    "revenue_estimate": "Under $1 Million",
    "employee_count_estimate": "12",
    "total_full_time_employees": 12,
    "total_part_time_employees": 0,
    "total_contractors": 0
  },
  "financial_metrics": {
    "revenue_data": {
      "current_year_revenue": 750000,
      "previous_year_revenue": 0,
      "revenue_2_years_ago": 0,
      "revenue_3_years_ago": 0,
      "revenue_4_years_ago": 0,
      "revenue_5_years_ago": 0,
      "revenue_cagr_3_year": 0.0,
      "revenue_cagr_5_year": 0.0,
      "q1_revenue_current_year": 0,
      "q2_revenue_current_year": 0,
      "q3_revenue_current_year": 0,
      "q4_revenue_current_year": 0,
      "revenue_seasonality_index": 0,
      "recurring_revenue_percentage": 0.0,
      "one_time_revenue_percentage": 0.0,
      "arr": 0,
      "mrr": 0,
      "average_contract_value": 0,
      "revenue_by_product_line_1": {"amount": 0, "percentage": 0.0},
      "revenue_by_geography_domestic": {"amount": 0, "percentage": 0.0},
      "revenue_by_geography_international": {"amount": 0, "percentage": 0.0},
      "revenue_concentration_risk": "N/A"
    },
    "profitability_metrics": {
      "gross_revenue": 0,
      "cogs": 0,
      "gross_profit": 0,
      "gross_profit_margin": 0.0,
      "operating_revenue": 0,
      "operating_expenses": 0,
      "operating_income": 0,
      "operating_margin": 0.0,
      "ebitda": 0,
      "ebitda_margin": 0.0,
      "ebit": 0,
      "ebit_margin": 0.0,
      "net_income": 0,
      "net_profit_margin": 0.0,
      "free_cash_flow": 0,
      "free_cash_flow_margin": 0.0
    },
    "balance_sheet": {
      "total_assets": 0,
      "current_assets": 0,
      "total_liabilities": 0,
      "current_liabilities": 0,
      "total_equity": 0,
      "cash_and_equivalents": 0,
      "total_debt": 0,
      "debt_to_equity_ratio": 0.0,
      "current_ratio": 0.0,
      "working_capital": 0,
      "cash_runway_months": 0
    },
    "unit_economics": {
      "cac": 0,
      "ltv": 0,
      "ltv_cac_ratio": 0.0,
      "cac_payback_months": 0,
      "monthly_churn_rate": 0.0,
      "annual_churn_rate": 0.0,
      "nrr": 0.0,
      "grr": 0.0,
      "arpu": 0,
      "arpa": 0
    }
  },
  "valuation_investment": {
    "valuation_metrics": {
      "current_valuation": 0,
      "enterprise_value": 0,
      "market_cap": 0,
      "ev_revenue_multiple": 0.0,
      "ev_ebitda_multiple": 0.0,
      "pe_ratio": 0.0
    },
    "funding_history": {
      "investment_history": "Debt - General",
      "total_funding_raised": 125000,
      "number_of_funding_rounds": 1,
      "last_funding_round_type": "Debt - General",
      "last_funding_amount": 125000,
      "last_funding_date": "2022-01-12",
      "last_funding_lead_investor": "N/A"
    },
    "ownership_structure": {
      "founder_ownership_percentage": 0.0,
      "management_ownership": 0.0,
      "employee_stock_pool": 0.0,
      "investor_ownership": 0.0,
      "number_of_shareholders": 0
    }
  },
  "leadership_management": {
    "executives": {
      "decision_maker_name": "Rob Vanator",
      "decision_maker_title": "Founder and President",
      "ceo_name": "Rob Vanator",
      "ceo_age": 0,
      "ceo_background": "N/A",
      "ceo_tenure_years": 0.0,
      "ceo_linkedin": "N/A",
      "cfo_name": "N/A",
      "cto_name": "N/A"
    },
    "founders": {
      "number_of_founders": 1,
      "founder_1_name": "Rob Vanator",
      "founder_1_role": "Founder and President",
      "founder_1_equity": 0.0,
      "founder_1_active": true
    },
    "team_metrics": {
      "management_stability": "Stable",
      "employee_growth_rate_1_year": 0.0,
      "engineering_team_size": 0,
      "sales_team_size": 0,
      "average_tenure_years": 0.0,
      "turnover_rate": 0.0,
      "glassdoor_rating": 0.0,
      "glassdoor_reviews": 0
    }
  },
  "market_competition": {
    "market_data": {
      "market_position": "Niche Player",
      "tam": 0,
      "sam": 0,
      "market_growth_rate": 0.0,
      "current_market_share": 0.0,
      "market_share_rank": 0
    },
    "competitive_analysis": {
      "competitive_advantages": [
        "Specialization in placing IT executives and enterprise-level professionals for Fortune 1000 companies",
        "Broad expertise across numerous IT technologies and platforms (e.g., UI/UX, Mobile Dev, Big Data, BI, Cloud Services, ERP, CRM)",
        "Global reach for talent placement (US, Western Europe, Asia)"
      ],
      "potential_challenges": [
        "Small employee base limiting scalability and large project handling capacity",
        "Competition from larger, established staffing agencies and IT consulting firms",
        "Reliance on debt financing for growth",
        "Limited public information on financial performance and customer base"
      ],
      "direct_competitors": [
        {"name": "SecureVision", "market_share": 0.0, "revenue": 0},
        {"name": "Hirewell", "market_share": 0.0, "revenue": 0},
        {"name": "GDC IT Solutions", "market_share": 0.0, "revenue": 0}
      ],
      "competitive_position": "Niche/Specialized",
      "barriers_to_entry": 3,
      "moat_strength": 2
    }
  },
  "customer_sales": {
    "customer_base": {
      "total_customers": 0,
      "customer_growth_rate": 0.0,
      "customer_retention_rate": 0.0,
      "nps_score": 0,
      "csat_score": 0.0
    },
    "customer_concentration": {
      "top_customer_revenue_percent": 0.0,
      "top_10_customers_revenue_percent": 0.0,
      "customer_concentration_risk": "Medium"
    },
    "sales_metrics": {
      "average_sales_cycle_days": 0,
      "conversion_rate": 0.0,
      "average_deal_size": 0,
      "win_rate": 0.0
    }
  },
  "technology_operations": {
    "technology_stack": {
      "technology_adoption_level": "High",
      "primary_languages": ["JavaScript", "HTML", "CSS", "iOS", "Android"],
      "cloud_provider": "Multi-cloud (AWS, Azure, IBM, Google)",
      "crm_system": "N/A",
      "erp_system": "N/A"
    },
    "infrastructure": {
      "infrastructure_type": "Cloud-based/Hybrid",
      "cloud_spend_monthly": 0,
      "system_uptime": 0.0,
      "scalability_score": 0
    },
    "rd_innovation": {
      "rd_team_size": 0,
      "rd_spending": 0,
      "rd_percent_revenue": 0.0,
      "patents_held": 0,
      "innovation_score": 0
    }
  },
  "legal_compliance": {
    "corporate_structure": {
      "legal_entity_type": "LLC",
      "state_incorporation": "IN",
      "regulatory_compliance_status": "Compliant"
    },
    "litigation": {
      "active_cases": 0,
      "settlement_amount_5_years": 0
    },
    "intellectual_property": {
      "patent_portfolio_size": 0,
      "trademark_registrations": 0,
      "ip_valuation": 0
    }
  },
  "esg_risk": {
    "environmental": {
      "esg_alignment": "N/A",
      "carbon_footprint": 0,
      "sustainability_score": 0
    },
    "social": {
      "employee_satisfaction": 0,
      "diversity_score": 0,
      "community_investment": 0
    },
    "governance": {
      "board_independence": 0.0,
      "governance_score": 0
    },
    "risk_assessment": {
      "overall_risk_level": "Medium",
      "financial_risk": "Medium",
      "market_risk": "Medium",
      "operational_risk": "Low"
    }
  },
  "growth_outlook": {
    "growth_strategy": {
      "primary_strategy": "Organic Growth",
      "geographic_expansion_potential": "High",
      "acquisition_strategy": false,
      "partnership_strategy": true
    },
    "exit_strategy": {
      "expected_exit_strategy": "Founder-led/Lifestyle Business",
      "ipo_readiness_score": 0,
      "exit_timeline_years": 0
    }
  },
  "acquisition_scoring": {
    "pe_scoring": {
      "acquisition_score": 4.0,
      "overall_opportunity_score": 5.0,
      "exit_readiness_level": "Low",
      "owner_age_indicators": "N/A",
      "succession_planning_signals": false,
      "acquisition_complexity": "Low",
      "revenue_range_fit": false,
      "company_age_fit": true
    },
    "acquisition_analysis": {
      "acquisition_barriers": [
        "Small revenue base for most traditional PE",
        "Limited public financial data",
        "Founder-dependent operations",
        "Competitive market for IT staffing/consulting"
      ],
      "synergy_opportunities": "Potential for integration with larger staffing or IT services firms to expand client base or geographic reach; cross-selling of services (staffing + development).",
      "industry_reputation": "Good",
      "deal_timeline_estimate": "Medium",
      "due_diligence_priorities": [
        "Verify client contracts and revenue streams",
        "Assess talent pipeline and retention strategies",
        "Evaluate profitability margins of staffing vs. development services",
        "Review any outstanding debt obligations and terms"
      ]
    }
  },
  "business_intelligence": {
    "market_intelligence": {
      "industry_consolidation_trend": "Medium",
      "digital_disruption_risk": "Medium",
      "recent_news_summary": "No recent major news specifically about Midwest Technology Partnership, LLC. General industry trends indicate growth in IT staffing and managed services.",
      "growth_signals": [
        "Continued demand for IT talent in Fortune 1000 companies",
        "Diversified service offerings beyond pure staffing (web/app development)",
        "Global reach for talent placement"
      ],
      "financial_health_indicators": [
        "Known debt financing from 2022 suggests prior funding need",
        "No public revenue figures beyond 'Under $1 Million' limit"
      ]
    },
    "lead_gen_intelligence": {
      "social_media_activity": "Low",
      "website_quality_score": 7,
      "communication_preference": "Direct Email/Phone",
      "marketing_sophistication": "Low",
      "recommended_approach": "Direct Outreach"
    }
  },
  "data_metadata": {
    "sources": {
      "primary_sources": ["https://www.mtpindy.com"],
      "secondary_sources": [
        "https://www.mtpindy.com",
        "https://www.mtpindy.com",
        "https://www.mtpindy.com",
        "https://www.mtpindy.com"
        "https://www.mtpindy.com",
        "https://www.mtpindy.com",
        "https://www.mtpindy.com",
        "https://www.mtpindy.com",
      ],
      "interview_sources": []
    },
    "quality": {
      "data_collection_date": "2025-06-17",
      "last_updated": "2025-06-17",
      "confidence_level": 3,
      "verification_status": "Partial",
      "data_gaps": [
        "Detailed financial statements (revenue, profit, balance sheet)",
        "Specific employee breakdown (full-time, part-time, contractors)",
        "Exact CEO age, background, and LinkedIn URL",
        "Specific customer data (total, retention, NPS, concentration)",
        "Internal technology systems (CRM, ERP)",
        "ESG metrics",
        "Detailed market share and TAM/SAM figures",
        "Succession planning signals"
      ]
    }
  }
}
```

🏢 PRIVATE EQUITY INVESTMENT ANALYSIS REPORT

**EXECUTIVE SUMMARY**

Midwest Technology Partnership, LLC (MTP) presents a potential, albeit small-scale, investment opportunity within the specialized IT staffing and development sector. While the company demonstrates a niche focus on placing IT executives and enterprise-level professionals for Fortune 1000 companies, its limited public financial data and small employee base (estimated 12 employees) make it suitable only for very small private equity mandates or strategic bolt-on acquisitions. The overall recommendation is **Monitor** for now, as more detailed financial and operational data would be required to warrant a full pursuit. Expected returns and timeline are highly speculative given the data gaps, but a 3-5 year holding period for organic growth and potential strategic sale could yield low to moderate returns, primarily through operational integration synergies if acquired by a larger entity.

**INVESTMENT OPPORTUNITY ASSESSMENT**

*   **Financial Attractiveness Analysis:** Midwest Technology Partnership has limited public financial data. PitchBook indicated "Revenue Under 1 Million" and recorded a $125K debt financing round in January 2022. Without detailed revenue trends, profitability metrics (gross profit, EBITDA, net income), or cash flow, a comprehensive financial assessment is challenging. The current revenue estimate of $750,000 (annualized for analysis purposes) for a 12-employee IT services firm suggests a lean operation. Its financial attractiveness as a standalone PE investment is low due to size and lack of transparency.
*   **Market Position and Competitive Advantages:** MTP operates in the IT staffing and application development space, with a stated focus on Fortune 1000 clients and executive/enterprise-level placements. This specialization offers a niche competitive advantage, allowing them to target specific high-value engagements. Their "expertise" across a wide range of technologies (UI/UX, Mobile Dev, Big Data, BI, Cloud Services, ERP, CRM) suggests a broad capability set for client projects. However, the market for IT staffing and consulting is highly competitive, facing larger firms like SecureVision, Hirewell, and GDC IT Solutions.
*   **Management Team Evaluation:** The company is led by its Founder and President, Rob Vanator. While the presence of a founder-led business suggests strong commitment and domain expertise, the small team size and lack of publicly identifiable senior leadership (CFO, CTO) suggest potential key-person dependency and limited institutional depth. Management stability appears high due to founder leadership, but a lack of broader team metrics prevents a deeper assessment.
*   **Growth Potential Assessment:** MTP's growth potential is primarily organic, leveraging its existing client relationships with Fortune 1000 companies and expanding its specialized IT talent placement and development services. Geographic expansion is already implied by their service reach across the US, Western Europe, and Asia. Opportunities exist in increasing wallet share with existing Fortune 1000 clients and expanding into new enterprise accounts. The general demand for IT talent and digital transformation services remains high, providing a favorable market backdrop.

**ACQUISITION READINESS ANALYSIS**

*   **Owner Motivation and Exit Readiness:** The company's 2002 founding makes it 23 years old, suggesting the founder, Rob Vanator, may be approaching a stage where succession planning or an eventual exit could become a consideration. However, no overt signals of exit readiness or succession planning were found. Given its current scale and funding structure (debt financing in 2022), it likely operates as a lifestyle business or a company growing at a steady pace without immediate pressure for a major liquidity event. Exit readiness is assessed as Low.
*   **Deal Complexity Assessment:** The acquisition complexity is assessed as Low, primarily due to the small size of the company (estimated 12 employees, revenue under $1M). This would simplify due diligence compared to larger, more complex organizations. However, the lack of detailed public financial records could introduce some diligence hurdles in verifying revenue streams and profitability.
*   **Valuation Framework:** A traditional private equity valuation using EBITDA multiples would be challenging due to the unavailability of profitability data. Given the "Under $1 Million" revenue estimate, a revenue multiple (e.g., 0.5x - 1.0x revenue) might be considered for a small IT services firm. Alternatively, a multiple of owner's discretionary earnings (SDE) might be more appropriate, but SDE data is not available. The $125K debt funding in 2022 suggests limited capital intensity or reliance on external financing for growth.
*   **Acquisition Barriers and Mitigation:**
    *   **Barrier:** Small revenue base and employee count, making it too small for most traditional PE funds.
    *   **Mitigation:** Target strategic buyers (larger IT services/staffing firms) looking for niche expertise or geographic expansion, or smaller search funds/individual investors.
    *   **Barrier:** Limited public financial data and transparency.
    *   **Mitigation:** Require extensive financial due diligence including access to internal financial statements, client contracts, and detailed cost breakdowns.
    *   **Barrier:** Founder-dependent operations and potential key-person risk.
    *   **Mitigation:** Implement strong retention incentives for the founder and key talent post-acquisition; develop clear transition plans.
    *   **Barrier:** Highly competitive market for IT staffing and consulting.
    *   **Mitigation:** Focus on integrating MTP's niche expertise to enhance the acquirer's service offerings and market differentiation.

**VALUE CREATION OPPORTUNITIES**

*   **Revenue Growth Initiatives (Quantified Impact):**
    *   **Expand Fortune 1000 Client Engagements:** Leverage existing relationships to identify new departments or divisions for IT staffing and development services. *Quantified Impact:* 10-15% annual revenue growth by increasing average contract value and new client acquisition.
    *   **Cross-selling and Upselling:** Actively promote web development and application development services to existing staffing clients, and vice-versa. *Quantified Impact:* Potential to increase revenue per client by 5-10%.
    *   **Geographic Expansion:** Capitalize on its stated global reach (US, Western Europe, Asia) by deepening presence in key high-demand IT markets. *Quantified Impact:* 5% additional revenue growth from new regions.
*   **Operational Efficiency Improvements:**
    *   **Process Automation:** Implement automation in candidate sourcing, client onboarding, and project management to reduce administrative overhead, especially beneficial for a small team.
    *   **Optimized Resource Utilization:** Ensure efficient deployment of IT talent across projects to maximize billable hours and reduce idle time.
*   **Strategic Initiatives and Add-on Potential:**
    *   **Strategic Acquisition Target:** MTP could be an attractive bolt-on for a larger IT consulting or staffing firm seeking to acquire niche expertise in executive IT placement or expand its presence with Fortune 1000 clients.
    *   **Partnerships:** Form alliances with complementary service providers (e.g., cybersecurity firms, cloud infrastructure providers) to offer bundled solutions.
*   **Technology Modernization Opportunities:** MTP demonstrates broad expertise in various technologies. Internally, investing in advanced CRM/ATS (Applicant Tracking System) software specifically tailored for IT staffing could enhance efficiency in talent management and client relationship tracking, streamlining operations and accelerating placement cycles.

**RISK ASSESSMENT & MITIGATION**

*   **High Priority Risks:**
    *   **Key-Person Dependency:** Heavy reliance on Founder/President Rob Vanator.
    *   *Mitigation:* Implement a clear succession plan, offer long-term incentives to the founder, and diversify leadership roles.
    *   **Revenue Concentration Risk:** Serving Fortune 1000 companies implies potential for significant revenue from a small number of clients. (Assumed Medium risk)
    *   *Mitigation:* Actively diversify client base and monitor revenue contributions from top clients.
*   **Medium Priority Risks:**
    *   **Talent Scarcity and Retention:** The IT staffing market is highly competitive for skilled talent.
    *   *Mitigation:* Invest in robust recruitment strategies, competitive compensation packages, professional development, and strong company culture.
    *   **Economic Downturn:** A recession could reduce demand for discretionary IT staffing and development projects.
    *   *Mitigation:* Maintain a lean cost structure, focus on mission-critical IT needs for clients, and explore counter-cyclical service offerings.
    *   **Competition:** Intense competition from larger, more established firms.
    *   *Mitigation:* Continue to reinforce niche specialization and service quality; differentiate through exceptional client service and deep technical expertise.
*   **Low Priority Risks:**
    *   **Operational Scalability:** Ability to scale operations with a small team.
    *   *Mitigation:* Implement scalable processes, leverage technology, and strategically grow the internal team.
*   **Regulatory and Market Risks:** Regulatory changes in labor laws or data privacy could impact operations. Market shifts in technology trends require continuous adaptation of expertise.

**DEAL EXECUTION STRATEGY**

*   **Recommended Approach and Timing:** Given the company's size and private nature, a direct, unsolicited outreach to the founder, Rob Vanator, is recommended. The timing should be opportunistic, perhaps leveraging industry events or direct referrals.
*   **Key Stakeholders and Decision Makers:** The primary decision maker is Rob Vanator, Founder and President. Any acquisition discussions would primarily involve him.
*   **Due Diligence Priorities:**
    *   **Financials:** Obtain detailed financial statements (P&L, Balance Sheet, Cash Flow) for the last 3-5 years. Verify revenue streams, client contracts, and gross margins for both staffing and development services.
    *   **Client Relationships:** Understand the depth and breadth of Fortune 1000 client relationships, contract terms, and historical retention rates. Assess any revenue concentration risk.
    *   **Talent Pool & Management:** Review the talent acquisition process, key employee contracts, and employee retention rates. Identify critical talent beyond the founder.
    *   **Operations & Technology:** Evaluate internal systems used for project management, talent tracking, and client delivery.
    *   **Legal & Compliance:** Review corporate structure, any past or pending litigations, and adherence to labor laws and international regulations (given global reach).
*   **Timeline and Next Steps:**
    *   **Phase 1 (1-2 months):** Initial outreach, non-disclosure agreement (NDA) execution, and preliminary information exchange.
    *   **Phase 2 (2-3 months):** Detailed financial and operational due diligence, management meetings, and initial valuation discussions.
    *   **Phase 3 (1-2 months):** Term sheet negotiation, legal and tax due diligence, and final closing.
    *   *Total Estimated Timeline:* 4-7 months.

📈 LEAD GENERATION ANALYSIS REPORT

**EXECUTIVE SUMMARY**

Midwest Technology Partnership (MTP) is a niche IT staffing and development firm targeting Fortune 1000 companies. The lead quality is **High**, driven by their specialized service offerings (IT executives, enterprise-level professionals, web/app development) and global reach. The primary opportunity is to enhance MTP's digital presence and structured outreach to capitalize on their deep expertise and client focus. A **Direct Outreach** strategy, combined with targeted content marketing, is recommended. Success probability is estimated as **Medium-High**, contingent on effective execution of the refined contact strategy and leveraging their niche strengths.

**LEAD QUALIFICATION ANALYSIS**

*   **ICP Fit Assessment:** MTP's Ideal Customer Profile (ICP) is Fortune 1000 companies requiring IT executive and enterprise-level talent, or specialized web and application development services. This represents a strong ICP fit for high-value B2B engagements.
*   **Business Needs Evaluation:** These large enterprises consistently face challenges in sourcing niche IT talent and require specialized development capabilities, which MTP aims to provide. The demand for digital transformation, cloud adoption, and advanced analytics further drives these needs.
*   **Buying Signals and Timing Indicators:**
    *   **Hiring Trends:** Significant open IT executive or specialized developer roles at Fortune 1000 companies.
    *   **Project Announcements:** Public announcements of new digital initiatives, system overhauls, or technology investments.
    *   **Industry Events/Conferences:** Participation in relevant tech or industry-specific summits (e.g., Midwest Technology Leaders Symposium attendees).
    *   **Competitor Activity:** Major talent gaps or project delays reported by competitors of target companies.
*   **Budget and Authority Assessment:** Fortune 1000 companies typically have established budgets for IT staffing and development. Decision-making authority resides with CIOs, VPs of IT, HR leaders for talent acquisition, and project managers for development. MTP's focus on enterprise-level and executive placement implies engagement with high-level decision-makers.

**CONTACT STRATEGY & APPROACH**

*   **Decision Maker Profiling:** Target CIOs, CTOs, VPs of IT, Directors of Talent Acquisition, and Heads of Software Development within Fortune 1000 organizations. For development services, focus on those driving digital transformation or product innovation. For staffing, target those with persistent hard-to-fill IT roles.
*   **Stakeholder Mapping:** Identify additional stakeholders such as HR Business Partners, Procurement, and Project Leads who influence vendor selection. Build relationships at multiple levels within target accounts.
*   **Optimal Outreach Methodology:**
    *   **Personalized Email Outreach:** Craft highly customized emails highlighting MTP's specific expertise (e.g., "IT Executive Placement for [Industry] Fortune 1000") and a clear value proposition, referencing specific challenges faced by large enterprises. Use the identified contact email format (e.g., info@mtpindy.com, though direct emails to decision makers would be preferable).
    *   **LinkedIn Sales Navigator:** Utilize LinkedIn for precise targeting of decision-makers and leverage personal connections for introductions. Engage with their content.
    *   **Strategic Cold Calling:** Follow up on personalized emails with targeted calls, demonstrating a deep understanding of the prospect's needs.
    *   **Referral Program:** Actively solicit referrals from existing satisfied Fortune 1000 clients.
    *   **Niche Conferences/Events:** Participate in and network at IT leadership forums, industry-specific tech conferences, and regional events like the Midwest Technology Leaders (MTL) forum.
*   **Value Proposition Customization:**
    *   **For Staffing:** Emphasize MTP's ability to source hard-to-find IT executive and enterprise-level talent globally, ensuring cultural fit and rapid placement for critical roles. Highlight "Right Talent. Right Place. Right Time."
    *   **For Development:** Showcase their expertise across a wide range of technologies and ability to deliver tailored web and application solutions for complex enterprise environments.

**COMPETITIVE LANDSCAPE & POSITIONING**

*   **Current Vendor Relationships:** Acknowledge that Fortune 1000 companies likely have existing vendor relationships with larger staffing firms (e.g., Robert Half, TEKsystems) and IT consultancies (e.g., Accenture, Deloitte).
*   **Competitive Differentiation Strategy:**
    *   **Niche Specialization:** Position MTP as the expert in high-stakes IT executive and enterprise-level placements, offering a more personalized and quality-focused approach than larger, generalized firms.
    *   **Agility & Responsiveness:** Highlight the benefits of working with a more agile partner compared to large, bureaucratic organizations.
    *   **Global Sourcing:** Emphasize their ability to source talent not just nationally, but also from Western Europe and Asia.
    *   **Combined Offering:** Differentiate by offering both specialized staffing and comprehensive development services, providing a holistic solution.
*   **Pricing and Positioning Approach:** Position MTP's services as premium, value-driven solutions for critical roles and complex projects, justifying a potentially higher fee due to specialized expertise and quality. Focus on ROI (e.g., faster time-to-hire for critical roles, enhanced project delivery).
*   **Proof Points and Case Studies:** Develop and feature case studies demonstrating successful placements of IT executives and delivery of complex web/app development projects for Fortune 1000 clients. Highlight quantifiable results (e.g., reduced time-to-fill, project efficiency gains).

**ENGAGEMENT ROADMAP**

*   **Phase 1: Awareness & Engagement (Weeks 1-4)**
    *   **Key Activities:** Identify 50-100 target Fortune 1000 accounts. Develop personalized outreach sequences (email, LinkedIn). Attend virtual industry webinars or local tech events.
    *   **Milestones:** 15% open rate on emails, 10% response rate on LinkedIn, 5-10 initial discovery calls.
    *   **Success Metrics:** Number of new qualified leads, initial meeting bookings.
*   **Phase 2: Qualification & Nurturing (Weeks 5-8)**
    *   **Key Activities:** Conduct in-depth discovery calls to qualify needs and budget. Send tailored follow-up resources (case studies, capability decks). Begin stakeholder mapping within accounts.
    *   **Milestones:** 3-5 opportunities moved to "pipeline," 1-2 proposals requested.
    *   **Success Metrics:** Number of qualified opportunities, average sales cycle length (initial stages).
*   **Phase 3: Proposal & Closing (Weeks 9-12+)**
    *   **Key Activities:** Develop customized proposals. Conduct solution presentations and negotiate terms.
    *   **Milestones:** 1 new client secured.
    *   **Success Metrics:** Win rate, average deal size.
*   **Resource Requirements:** Dedicated business development representative, marketing support for content creation, access to LinkedIn Sales Navigator or similar prospecting tools.

**RISK FACTORS & OBJECTION HANDLING**

*   **Potential Objections and Responses:**
    *   *"You're too small for our enterprise needs."*
        *   **Response:** "Our smaller size allows for more agile, personalized service and a deeper understanding of your specific needs, often overlooked by larger firms. We specialize in critical, high-impact roles where our focused approach delivers superior talent."
    *   *"We already have established vendors."*
        *   **Response:** "We understand. We don't aim to replace your current partners, but rather to complement them by addressing your most challenging IT talent and development needs, especially for executive and niche roles where our specialized focus provides a distinct advantage."
    *   *"How can you compete with larger firms' resources/network?"*
        *   **Response:** "Our global network and 'over 100 years' of combined expertise in targeted IT recruitment allows us to tap into a talent pool that many larger, more generalized firms may miss. Our focus isn't volume, it's precision and quality."
*   **Competitive Risks and Mitigation:**
    *   **Risk:** Larger competitors with broader brand recognition and larger sales teams.
    *   **Mitigation:** Focus on relationship building, thought leadership in niche areas, and leveraging existing client testimonials.
*   **Internal Challenges and Solutions:**
    *   **Challenge:** Limited marketing resources or dedicated sales team bandwidth.
    *   **Solution:** Prioritize targeted efforts over broad campaigns. Consider outsourcing specific lead generation activities or investing in a dedicated part-time resource.
*   **Contingency Planning:** If direct outreach yields low conversion, explore strategic partnerships with complementary service providers or participate more actively in industry associations to gain referrals.

**NEXT STEPS & ACCOUNTABILITY**

*   **Immediate Actions (next 48 hours):**
    *   Develop a core set of 5-10 compelling case studies for Fortune 1000 clients.
    *   Identify 20 high-priority target accounts based on recent IT hiring trends or project announcements.
*   **Short-Term Goals (next 2 weeks):**
    *   Draft personalized email and LinkedIn message templates for initial outreach.
    *   Initiate outreach to the identified 20 target accounts.
*   **Long-Term Objectives (next quarter):**
    *   Secure 3-5 new qualified meetings with decision-makers.
    *   Establish a consistent content marketing rhythm (e.g., 1-2 blog posts per month on IT staffing/development trends for enterprises).
*   **Success Metrics and Review Schedule:**
    *   **Key Metrics:** Number of initial meetings, conversion rate from meeting to qualified opportunity, new client acquisition.
    *   **Review Schedule:** Weekly check-ins on outreach metrics, monthly deep-dives on pipeline progress and strategy adjustments. Initial review of engagement roadmap success at the end of Quarter 1.

**Data Metadata:**
*   **Sources:** Primary: mtpindy.com. Secondary: PitchBook, 6Sense, RocketReach, Dice.com, ZipRecruiter, G2.
*   **Data Collection Date:** 2025-06-17
*   **Last Updated:** 2025-06-17
*   **Confidence Level:** 3/5 (Moderate. While foundational company details are available, specific financial, operational, and customer metrics for this private company are largely absent and rely on estimates or industry averages.)
*   **Verification Status:** Partial (Core company info verified, financial and operational details are estimated or N/A).
*   **Data Gaps:** Detailed financial statements, precise employee breakdown, specific CEO/CFO/CTO details, customer base size/retention, internal tech systems, ESG data."""),
                        ],
                ),
                genai.types.Content(
                    role="user",
                    parts=[
                        genai.types.Part.from_text(text=f"""{company_name}"""),
                    ],
                ),
            ]
            
            generate_content_config = genai.types.GenerateContentConfig(
                tools=[genai.types.Tool(google_search=genai.types.GoogleSearch())],
                thinking_config=types.ThinkingConfig(thinking_budget=-1)
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