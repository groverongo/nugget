from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Tuple
import io

from config import init_config
from handlers.heatmap import diagrama_predicciones
from handlers.evolution import grafico_evolucion
from handlers.chat import handle_chat

config = init_config()
app = FastAPI(title=config.app_name, debug=config.debug)


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


class ChatRequest(BaseModel):
    system_instruction: str = Field(
        ...,
        description="The system prompt that sets the assistant's behavior."
    )
    user_message: str = Field(
        ...,
        description="The user's text input."
    )
    model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq model to use."
    )


class ChatResponse(BaseModel):
    content: str = Field(..., description="LLM response text")
    model: str = Field(..., description="Model used for response")


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


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        content = await handle_chat(
            system_instruction=request.system_instruction,
            user_message=request.user_message,
            model_name=request.model,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq/agent error: {e}")

    return ChatResponse(content=content, model=request.model)

