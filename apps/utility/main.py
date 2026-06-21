from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Tuple
import io

from handlers.heatmap import diagrama_predicciones
from handlers.evolution import grafico_evolucion

app = FastAPI()


class HeatmapRequest(BaseModel):
    duples: List[Tuple[float, float]]
    resolution: int = 300
    title: str = "Position Density Heatmap"
    x_label: str = "X Coordinate"
    y_label: str = "Y Coordinate"


class EvolutionRequest(BaseModel):
    matches: List[str]
    cumulative_points: List[int]
    title: str = "Evolución de puntos"


@app.post("/evolution")
async def generate_evolution(request: EvolutionRequest):
    image_bytes = grafico_evolucion(
        matches=request.matches,
        cumulative_points=request.cumulative_points,
        title=request.title,
        return_bytes=True,
    )

    return StreamingResponse(
        io.BytesIO(image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=evolucion.png"},
    )


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

