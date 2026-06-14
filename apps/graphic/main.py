from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Tuple
import io

from handlers.heatmap import diagrama_predicciones

app = FastAPI()


class HeatmapRequest(BaseModel):
    duples: List[Tuple[float, float]]
    resolution: int = 300
    title: str = "Position Density Heatmap"
    x_label: str = "X Coordinate"
    y_label: str = "Y Coordinate"


@app.post("/heatmap")
async def generate_heatmap(request: HeatmapRequest):
    image_bytes = diagrama_predicciones(
        coordinates=request.duples,
        resolution=request.resolution,
        title=request.title,
        x_label=request.x_label,
        y_label=request.y_label,
        return_bytes=True
    )

    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=heatmap.png"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
