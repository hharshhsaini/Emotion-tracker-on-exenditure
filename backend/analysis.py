import os
import json
import io
import pandas as pd
from sklearn.ensemble import IsolationForest
from dotenv import load_dotenv
from google import genai
from google.genai import types
import fitz  # PyMuPDF

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Detect spending anomalies using Isolation Forest."""
    df = df.copy()
    if len(df) < 5:
        df["is_anomaly"] = False
        return df
    
    amounts = df["Amount"].abs().values.reshape(-1, 1)
    model = IsolationForest(contamination=0.15, random_state=42)
    predictions = model.fit_predict(amounts)
    df["is_anomaly"] = predictions == -1
    return df


def generate_emotional_insight(df_anomalies):
    """Generate insight - uses simple logic to save API calls."""
    if df_anomalies.empty:
        return "Great job! No unusual spending detected this month."
    
    total = abs(df_anomalies["Amount"].sum())
    count = len(df_anomalies)
    categories = df_anomalies["Category"].value_counts()
    top_cat = categories.index[0] if len(categories) > 0 else "various items"
    
    return f"You had {count} unusual transactions totaling ${total:.2f}, mostly on {top_cat}. Consider if these were planned purchases or impulse buys. A quick pause before buying can help!"


def parse_ai_response(response_text: str) -> list:
    """Parse AI response to extract JSON array."""
    text = response_text.strip()
    
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("["):
                text = part
                break
    
    start = text.find("[")
    end = text.rfind("]") + 1
    if start != -1 and end > start:
        text = text[start:end]
    
    return json.loads(text)


def extract_transactions_from_image(image_bytes: bytes, mime_type: str) -> pd.DataFrame:
    """Extract transactions from a single image - ONE API call."""
    try:
        prompt = """Extract ALL transactions from this image as JSON array:
[{"Date": "2024-01-15", "Description": "Store", "Amount": -25.99, "Category": "Shopping"}]

Rules: negative=expense, positive=income, date=YYYY-MM-DD, return [] if none found."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ]
        )
        
        transactions = parse_ai_response(response.text)
        if not transactions:
            return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])
        return pd.DataFrame(transactions)

    except Exception as e:
        print(f"Image extraction error: {e}")
        return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])


def extract_transactions_from_pdf(pdf_bytes: bytes) -> pd.DataFrame:
    """Extract from PDF - combines all pages into ONE API call to save credits."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Extract text from all pages first (FREE - no API)
        all_text = ""
        for page in doc:
            all_text += page.get_text() + "\n"
        
        doc.close()
        
        # If we got text, use text-based extraction (cheaper)
        if len(all_text.strip()) > 100:
            return extract_transactions_from_text(all_text)
        
        # Fallback: render first page only as image
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # Lower resolution
        img_bytes = pix.tobytes("png")
        doc.close()
        
        return extract_transactions_from_image(img_bytes, "image/png")
        
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])


def extract_transactions_from_text(text: str) -> pd.DataFrame:
    """Extract transactions from text - ONE API call."""
    try:
        # Limit text to reduce tokens
        text = text[:4000]
        
        prompt = f"""Extract transactions from this bank statement text as JSON:
[{{"Date": "2024-01-15", "Description": "Store", "Amount": -25.99, "Category": "Shopping"}}]

Text:
{text}

Rules: negative=expense, positive=income, date=YYYY-MM-DD, return [] if none."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        transactions = parse_ai_response(response.text)
        if not transactions:
            return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])
        return pd.DataFrame(transactions)

    except Exception as e:
        print(f"Text extraction error: {e}")
        return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])


def extract_transactions_from_csv(csv_content: str) -> pd.DataFrame:
    """Smart CSV parsing - tries without AI first."""
    try:
        df = pd.read_csv(io.StringIO(csv_content))
        
        # Try to find columns (case-insensitive)
        cols_lower = {c.lower().strip(): c for c in df.columns}
        
        date_names = ['date', 'transaction date', 'txn date', 'value date', 'posting date']
        desc_names = ['description', 'narration', 'particulars', 'details', 'remarks', 'transaction details']
        amount_names = ['amount', 'debit', 'credit', 'withdrawal', 'deposit', 'transaction amount']
        
        date_col = next((cols_lower[c] for c in date_names if c in cols_lower), None)
        desc_col = next((cols_lower[c] for c in desc_names if c in cols_lower), None)
        amount_col = next((cols_lower[c] for c in amount_names if c in cols_lower), None)
        
        # If found standard columns, no API needed!
        if date_col and desc_col and amount_col:
            result = pd.DataFrame({
                'Date': df[date_col].astype(str),
                'Description': df[desc_col].astype(str),
                'Amount': pd.to_numeric(df[amount_col], errors='coerce').fillna(0)
            })
            result['Category'] = 'Uncategorized'
            result = result[result['Amount'] != 0]  # Remove zero amounts
            return result
        
        # Only use AI if we can't parse it ourselves
        return extract_transactions_from_text(csv_content[:4000])
        
    except Exception as e:
        print(f"CSV extraction error: {e}")
        return pd.DataFrame(columns=["Date", "Description", "Amount", "Category"])
