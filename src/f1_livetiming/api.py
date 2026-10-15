from fastapi import FastAPI

app = FastAPI(
    tittle="F1 Live Timing",
    version="0.1.0",
)

@app.get("/health")
def health():
    return {"status": "ok"}