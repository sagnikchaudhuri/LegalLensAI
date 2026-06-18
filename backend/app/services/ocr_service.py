from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException


@lru_cache(maxsize=1)
def _reader():
    try:
        import easyocr
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="OCR support requires EasyOCR. Install backend requirements and retry.",
        ) from exc
    return easyocr.Reader(["en"], gpu=False)


def ocr_image_path(path: Path) -> str:
    try:
        result = _reader().readtext(str(path), detail=0, paragraph=True)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="OCR failed for the uploaded image.") from exc
    return "\n".join(result).strip()


def ocr_pdf_page(page) -> str:
    try:
        import numpy as np
        from PIL import Image

        pixmap = page.get_pixmap(dpi=200)
        image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
        result = _reader().readtext(np.asarray(image), detail=0, paragraph=True)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="OCR failed for a scanned PDF page.") from exc
    return "\n".join(result).strip()
