from fastapi import FastAPI, HTTPException
import base64
import cv2
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import pytesseract
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class ImageCheckPayload(BaseModel):
    image_base64: str
    field_name: str = "upload"

from fastapi import FastAPI, HTTPException
import base64
import cv2
import numpy as np
import re
import pytesseract
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageCheckPayload(BaseModel):
    image_base64: str
    field_name: str = "upload"

@app.post("/check-blur")
async def check_blur(payload: ImageCheckPayload):
    try:
        # 1. Decode base64 to byte buffer
        img_bytes = base64.b64decode(payload.image_base64)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        
        # 2. Decode bytes into OpenCV image
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return {"is_clear": False, "score": 0.0, "reason": "Failed to decode image file.", "extracted_text": ""}

        h, w = image.shape[:2]

        # 3. Scan Resolution Check
        if w < 250 or h < 250:
            return {
                "is_clear": False,
                "score": 0.0,
                "reason": f"Scan resolution too low ({w}x{h} px). Minimum required is 250x250 px.",
                "extracted_text": ""
            }

        # 4. Aspect-Ratio Crop Check (detects slivers/cropped edges)
        aspect_ratio = max(h, w) / max(min(h, w), 1)
        if aspect_ratio > 4.0:
            return {
                "is_clear": False,
                "score": 0.0,
                "reason": "Image appears severely cropped or incomplete. Please upload the full document page.",
                "extracted_text": ""
            }

        # 5. Downscale large images for fast processing
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        # 6. Convert to Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 7. Lighting / Exposure Check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 35.0:
            return {"is_clear": False, "score": 0.0, "reason": "Image is too dark to read.", "extracted_text": ""}
        if mean_brightness > 235.0:
            return {"is_clear": False, "score": 0.0, "reason": "Image is overexposed or washed out.", "extracted_text": ""}

        # 8. Laplacian Variance Sharpness Check
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance_score = float(laplacian.var())
        BLUR_THRESHOLD = 100.0
        is_clear = variance_score >= BLUR_THRESHOLD

        if not is_clear:
            return {
                "is_clear": False,
                "score": round(variance_score, 2),
                "reason": f"Image is blurry (sharpness: {round(variance_score, 1)} / {BLUR_THRESHOLD}).",
                "extracted_text": ""
            }

        # 9. Extract Text via Local OCR (Tesseract)
        raw_ocr = pytesseract.image_to_string(gray, config="--psm 3")
        clean_text = re.sub(r"\s+", " ", raw_ocr).strip().lower()

        return {
            "is_clear": True,
            "score": round(variance_score, 2),
            "reason": "Document is sharp, clear, and readable.",
            "extracted_text": clean_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))