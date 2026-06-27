from pydantic_settings import BaseSettings
from pydantic import Field


class AppSettings(BaseSettings):
    """Application settings with defaults."""

    app_name: str = Field(default="Utility API", description="Application name")
    debug: bool = Field(default=False, description="Debug mode")
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of worker processes")

    groq_api_key: str = Field(default="", description="Groq API key")
    groq_model: str = Field(
        default="llama-3.3-70b-versatile", description="Default Groq model"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False

    def validate_required_env_vars(self) -> None:
        """Verify that required environment variables are set."""
        required = ["groq_api_key"]
        missing = [var for var in required if not getattr(self, var)]

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}"
            )
