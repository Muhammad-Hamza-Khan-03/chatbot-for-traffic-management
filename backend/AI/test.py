import pandas as pd
from insightai.insightai import InsightAI

import os
import json

os.environ['LLM_CONFIG'] = '''[
    {"agent": "Expert Selector", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 500, "temperature": 0}},
    {"agent": "Analyst Selector", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 500, "temperature": 0}},
    {"agent": "SQL Analyst", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "SQL Generator", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "SQL Executor", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Planner", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Code Generator", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Code Debugger", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Solution Summarizer", "details": {"model": "meta-llama/llama-4-scout-17b-16e-instruct", "provider":"groq","max_tokens": 2000, "temperature": 0}}
]'''

file_name ='Violation_Records.xlsx' 

if file_name.endswith('.csv'):
    df = pd.read_csv(file_name)
    print("CSV file loaded successfully.")
elif file_name.endswith('.xlsx'):
    df = pd.read_excel(file_name)
    # If columns are unnamed or the top row is null, set columns from the first non-null row
    if any(str(col).startswith('Unnamed') for col in df.columns) or pd.isnull(df.columns).all():
        # Find the first row with at least one non-null value
        for i, row in df.iterrows():
            if not row.isnull().all():
                df.columns = row
                df = df.drop(i).reset_index(drop=True)
                break
    print(df.columns)
    print("Excel file loaded successfully.")
    
# Initialize InsightAI
insight = InsightAI(df=df, debug=True)

# Single question
insight.pd_agent_converse("Tell me about the car accidents with the help of visualization?")

# Interactive mode
# insight.pd_agent_converse()


