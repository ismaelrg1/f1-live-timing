FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:$PATH"
ENV F1_DATA_DIR=/data

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src

RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 10001 f1 \
    && mkdir /data \
    && chown -R f1:f1 /app /data

USER f1

EXPOSE 8000

VOLUME ["/data"]

CMD ["uvicorn", "f1_livetiming.api:app", "--host", "0.0.0.0", "--port", "8000"]