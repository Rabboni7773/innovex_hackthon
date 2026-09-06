from fastapi import FastAPI, HTTPException
import base64
import cv2
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .llm_verifiers import need_or_not_provider, final_review_provider
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NeedOrNotReq(BaseModel):
    page_snapshot : str

class FianlReviewReq(BaseModel):
    original_data : dict
    provided_data : dict

app.get("/need_or_not")
async def need_or_not(snapshot: NeedOrNotReq):
    result = await need_or_not_provider(snapshot.page_snapshot)
    if result == "yes":
        return {"should_activate": True}
    return {"should_activate" : False}

app.get("/final_review")
async def final_cheaker(req: FianlReviewReq):
    result = await final_review_provider(req.original_data, req.provided_data)
    return result


class ImageCheckPayload(BaseModel):
    image_base64: str
    field_name: str = "upload"

@app.post("/api/check-blur")
async def check_blur(payload: ImageCheckPayload):
    try:
        # 1. Decode base64 into a NumPy byte buffer
        img_bytes = base64.b64decode(payload.image_base64)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        
        # 2. Decode bytes into an OpenCV BGR image
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return {"is_clear": False, "score": 0.0, "reason": "Failed to decode image file."}

        # 3. Optional optimization: Resize large uploads so computation is instant
        # Downscaling to max 1024px keeps aspect ratio and speeds up convolution
        h, w = image.shape[:2]
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        # 4. Convert to Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 5. Check for lighting extremes first (dark or washed out photos skew variance)
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 35.0:
            return {"is_clear": False, "score": 0.0, "reason": "Image is too dark to inspect."}
        if mean_brightness > 235.0:
            return {"is_clear": False, "score": 0.0, "reason": "Image is overexposed/washed out."}

        # 6. Apply Laplacian operator (using 64-bit float to prevent overflow)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)

        # 7. Calculate variance of the Laplacian response
        variance_score = float(laplacian.var())

        # Baseline threshold: ~100.0 is the standard benchmark
        BLUR_THRESHOLD = 100.0
        is_clear = variance_score >= BLUR_THRESHOLD

        return {
            "is_clear": is_clear,
            "score": round(variance_score, 2),
            "reason": "Image is sharp and clear." if is_clear else f"Image is blurry (sharpness: {round(variance_score, 1)} / {BLUR_THRESHOLD})."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
