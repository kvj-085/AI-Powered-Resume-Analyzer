from fastapi import FastAPI, UploadFile, File
from transformers import pipeline
from pymongo import MongoClient
from typing import Dict
import datetime
import os
from dotenv import load_dotenv

app = FastAPI()

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allows frontend on any port (safe in dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === SETUP ===

# MongoDB URI 
MONGO_URI = os.getenv("MONGO_URI")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["resume_analyzer"]
collection = db["resumes"]

# HuggingFace zero-shot classifier
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# === ROUTES ===

@app.post("/analyze-resume/")
async def analyze_resume(file: UploadFile = File(...)) -> Dict:
    content = await file.read()
    text = content.decode("utf-8")
    # Step 1: Extract name from the first line of the resume
    name = text.strip().split("\n")[0]
    # Step 2: Define role labels
    labels = ["Machine Learning Engineer", "Software Developer", "Data Scientist", "Frontend Developer"]
    # Step 3: Run zero-shot classification
    result = classifier(text, labels)
    # Step 4: Store in MongoDB with extracted name and top prediction
    document = {
        "name": name,
        "resume_text": text,
        "predictions": result,
        "top_prediction": result["labels"][0],
        "score": result["scores"][0],
        "timestamp": datetime.datetime.utcnow()
    }

    inserted = collection.insert_one(document)

    return {
        "status": "success",
        "inserted_id": str(inserted.inserted_id),
        "top_prediction": result['labels'][0],
        "score": result['scores'][0],
        "summary": result
    }

@app.get("/history/")
def get_resume_history():
    history = list(collection.find().sort("timestamp", -1).limit(10))
    for doc in history:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string for JSON
    return {"resumes": history}
