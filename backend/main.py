from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from analysis import (
    detect_anomalies, 
    generate_emotional_insight, 
    extract_transactions_from_image,
    extract_transactions_from_pdf,
    extract_transactions_from_csv
)

app = FastAPI(title="AI Expense Emotional Insight Tracker")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a bank statement (CSV, PDF) or receipt image.
    Uses AI to extract and analyze transactions from any format.
    """
    filename = file.filename.lower()
    content = await file.read()
    
    df = pd.DataFrame()
    
    # Handle CSV files
    if filename.endswith(".csv"):
        try:
            csv_content = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                csv_content = content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Unable to decode CSV file")
        
        df = extract_transactions_from_csv(csv_content)
    
    # Handle PDF files
    elif filename.endswith(".pdf"):
        df = extract_transactions_from_pdf(content)
    
    # Handle image files
    elif any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]):
        if filename.endswith(".png"):
            mime_type = "image/png"
        elif filename.endswith(".webp"):
            mime_type = "image/webp"
        elif filename.endswith((".heic", ".heif")):
            mime_type = "image/heic"
        else:
            mime_type = "image/jpeg"
        
        df = extract_transactions_from_image(content, mime_type)
    
    else:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Please upload CSV, PDF, or image (JPG, PNG, WebP, HEIC)"
        )
    
    # Validate we got transactions
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Could not extract transactions. This may be due to API rate limits. Please wait a minute and try again, or use a CSV with columns: Date, Description, Amount"
        )
    
    # Ensure required columns exist
    if "Category" not in df.columns:
        df["Category"] = "Uncategorized"
    
    # Ensure Amount is numeric
    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce").fillna(0)
    
    # Detect anomalies
    df_analyzed = detect_anomalies(df)
    
    # Get anomalies for insight generation
    df_anomalies = df_analyzed[df_analyzed["is_anomaly"] == True]
    
    # Generate emotional insight
    insight = generate_emotional_insight(df_anomalies)
    
    # Prepare response
    transactions = df_analyzed.to_dict(orient="records")
    anomalies = df_anomalies.to_dict(orient="records")
    
    return {
        "transactions": transactions,
        "anomalies": anomalies,
        "insight": insight
    }


@app.get("/")
async def root():
    return {"message": "AI Expense Emotional Insight Tracker API", "status": "running"}
