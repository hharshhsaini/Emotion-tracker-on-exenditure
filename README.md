# 💰 AI Expense Emotional Insight Tracker

An intelligent expense analyzer that detects unusual spending patterns and provides empathetic financial coaching using AI.

## Features

- 📊 **Smart File Upload** — Supports CSV, PDF, and images (JPG, PNG, WebP, HEIC)
- 🤖 **AI-Powered Extraction** — Uses Google Gemini to extract transactions from any format
- 🔍 **Anomaly Detection** — Machine learning (Isolation Forest) identifies unusual spending
- 💭 **Emotional Insights** — Get kind, non-judgmental coaching on spending triggers
- 📈 **Visual Dashboard** — Interactive charts to visualize your spending patterns

## Tech Stack

**Backend:** FastAPI, Python, Pandas, Scikit-learn, Google Gemini AI, PyMuPDF  
**Frontend:** React, Vite, Tailwind CSS, Recharts

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

```
GEMINI_API_KEY=your_google_gemini_api_key
```

Get your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)

## License

MIT
