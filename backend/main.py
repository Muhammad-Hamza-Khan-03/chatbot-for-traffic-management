from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import pandas as pd
import sys
import re
import glob
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Add the AI directory to Python path to import insightai
sys.path.append(os.path.join(os.path.dirname(__file__), 'AI'))

from AI.insightai.insightai import InsightAI

app = FastAPI(title="AI Data Analysis with Visualization API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
DATA_FILES_DIR = os.path.join(os.path.dirname(__file__), "Data_files")
VISUALIZATION_DIR = os.path.join(os.path.dirname(__file__), "visualization")
os.makedirs(DATA_FILES_DIR, exist_ok=True)
os.makedirs(VISUALIZATION_DIR, exist_ok=True)

# Set up LLM Config as environment variable
LLM_CONFIG = [
    {"agent": "Expert Selector", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 500, "temperature": 0}},
    {"agent": "Analyst Selector", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 500, "temperature": 0}},
    {"agent": "SQL Analyst", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "SQL Generator", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "SQL Executor", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Planner", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Code Generator", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Code Debugger", "details": {"model": "deepseek-r1-distill-llama-70b", "provider":"groq","max_tokens": 2000, "temperature": 0}},
    {"agent": "Solution Summarizer", "details": {"model": "meta-llama/llama-4-scout-17b-16e-instruct", "provider":"groq","max_tokens": 2000, "temperature": 0}}
]

os.environ['LLM_CONFIG'] = json.dumps(LLM_CONFIG)

# Enhanced Pydantic models for request/response
class FileInfo(BaseModel):
    filename: str
    size: int
    upload_date: str

class AnalysisRequest(BaseModel):
    filename: str
    question: Optional[str] = None

class CodeBlock(BaseModel):
    type: str  # 'python', 'yaml', 'json', etc.
    content: str

class VisualizationData(BaseModel):
    filename: str
    data: Dict[Any, Any]
    created_at: str

class AnalysisResponse(BaseModel):
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    code_blocks: Optional[List[CodeBlock]] = None
    visualizations: Optional[List[VisualizationData]] = None

class VisualizationListResponse(BaseModel):
    visualizations: List[VisualizationData]

def parse_agent_response(response_text: str) -> List[CodeBlock]:
    """
    Parse AI agent responses to extract code blocks with different syntaxes.
    Handles ```python, ```yaml, ```json, etc. code blocks from agent responses.
    """
    code_blocks = []
    
    # Pattern to match code blocks with language specification
    # This regex captures code blocks like ```python, ```yaml, ```json
    pattern = r'```(\w+)\s*\n(.*?)\n```'
    matches = re.findall(pattern, response_text, re.DOTALL)
    
    for language, code_content in matches:
        code_blocks.append(CodeBlock(
            type=language.lower(),
            content=code_content.strip()
        ))
    
    return code_blocks

def get_recent_visualizations() -> List[VisualizationData]:
    """
    Scan the visualization directory for JSON files and return them as structured data.
    This function looks for Plotly JSON files created by the AI agents.
    """
    visualizations = []
    
    # Get all JSON files from the visualization directory
    json_files = glob.glob(os.path.join(VISUALIZATION_DIR, "*.json"))
    
    for json_file in json_files:
        try:
            # Get file modification time for sorting
            file_stat = os.stat(json_file)
            created_at = pd.Timestamp(file_stat.st_mtime, unit='s').strftime('%Y-%m-%d %H:%M:%S')
            
            # Read the JSON visualization data
            with open(json_file, 'r', encoding='utf-8') as f:
                viz_data = json.load(f)
            
            visualizations.append(VisualizationData(
                filename=os.path.basename(json_file),
                data=viz_data,
                created_at=created_at
            ))
        except Exception as e:
            print(f"Error reading visualization file {json_file}: {e}")
            continue
    
    # Sort by creation time, most recent first
    visualizations.sort(key=lambda x: x.created_at, reverse=True)
    return visualizations

def clear_old_visualizations():
    """
    Clear visualization files before new analysis to avoid confusion.
    This ensures that only visualizations from the current analysis are shown.
    """
    json_files = glob.glob(os.path.join(VISUALIZATION_DIR, "*.json"))
    for json_file in json_files:
        try:
            os.remove(json_file)
        except Exception as e:
            print(f"Error removing old visualization {json_file}: {e}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI Data Analysis with Visualization API is running"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file to the Data_files directory"""
    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Only CSV and Excel files are allowed"
        )
    
    try:
        file_path = os.path.join(DATA_FILES_DIR, file.filename)
        
        if os.path.exists(file_path):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} already exists"
            )
        
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return JSONResponse(
            content={
                "message": f"File {file.filename} uploaded successfully",
                "filename": file.filename,
                "size": len(contents)
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/files/")
async def list_files():
    """Get list of all uploaded files in Data_files directory"""
    try:
        files = []
        for filename in os.listdir(DATA_FILES_DIR):
            if filename.lower().endswith(('.csv', '.xlsx', '.xls')):
                file_path = os.path.join(DATA_FILES_DIR, filename)
                file_stats = os.stat(file_path)
                files.append({
                    "filename": filename,
                    "size": file_stats.st_size,
                    "upload_date": pd.Timestamp(file_stats.st_mtime, unit='s').strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return {"files": files}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    """Delete a specific file from Data_files directory"""
    try:
        file_path = os.path.join(DATA_FILES_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        os.remove(file_path)
        return {"message": f"File {filename} deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@app.get("/visualizations/", response_model=VisualizationListResponse)
async def get_visualizations():
    """Get all available visualizations from the visualization directory"""
    try:
        visualizations = get_recent_visualizations()
        return VisualizationListResponse(visualizations=visualizations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching visualizations: {str(e)}")

@app.delete("/visualizations/")
async def clear_visualizations():
    """Clear all visualization files"""
    try:
        clear_old_visualizations()
        return {"message": "All visualizations cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing visualizations: {str(e)}")

@app.post("/analyze/", response_model=AnalysisResponse)
async def analyze_file(request: AnalysisRequest):
    """
    Analyze a file using InsightAI agent with enhanced response parsing.
    This endpoint now captures and parses agent responses including code blocks and visualizations.
    """
    try:
        file_path = os.path.join(DATA_FILES_DIR, request.filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Clear old visualizations before starting new analysis
        clear_old_visualizations()
        
        # Load the file into a DataFrame
        if request.filename.lower().endswith('.csv'):
            df = pd.read_csv(file_path)
            print("CSV file loaded successfully.")
        elif request.filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
            # Handle Excel files with unnamed columns
            if any(str(col).startswith('Unnamed') for col in df.columns) or pd.isnull(df.columns).all():
                for i, row in df.iterrows():
                    if not row.isnull().all():
                        df.columns = row
                        df = df.drop(i).reset_index(drop=True)
                        break
            print("Excel file loaded successfully.")
        
        # Set up the visualization directory environment variable for the AI agent
        os.environ['VISUALIZATION_DIR'] = VISUALIZATION_DIR
        
        # Initialize InsightAI with the dataframe
        insight = InsightAI(df=df, debug=True)
        
        # Use default question if none provided
        question = request.question or "Provide a comprehensive analysis of this dataset with key insights and visualizations."
        
        # Call the InsightAI agent
        # Note: The agent will generate visualizations and save them to the visualization directory
        result = insight.pd_agent_converse(question)
        
        # Parse any code blocks from the response if result is a string
        code_blocks = []
        if isinstance(result, str):
            code_blocks = parse_agent_response(result)
        
        # Get any visualizations that were created during analysis
        visualizations = get_recent_visualizations()
        
        return AnalysisResponse(
            success=True,
            result=f"Analysis completed successfully for {request.filename}. Question: {question}",
            code_blocks=code_blocks,
            visualizations=visualizations
        )
    
    except FileNotFoundError:
        return AnalysisResponse(
            success=False,
            error="File not found",
            code_blocks=[],
            visualizations=[]
        )
    except Exception as e:
        return AnalysisResponse(
            success=False,
            error=f"Error during analysis: {str(e)}",
            code_blocks=[],
            visualizations=[]
        )

@app.post("/quick-analyze/{filename}")
async def quick_analyze(filename: str, question: str = "Analyze this dataset"):
    """Quick analysis endpoint that takes filename as path parameter"""
    request = AnalysisRequest(filename=filename, question=question)
    return await analyze_file(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)