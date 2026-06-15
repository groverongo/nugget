FROM ghcr.io/astral-sh/uv:alpine

COPY . .

RUN uv sync

EXPOSE 8000

CMD [ "uv", "run", "fastapi", "run", "main.py" ]