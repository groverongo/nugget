import os
import yaml
from pathlib import Path
from typing import Dict, Any

from .settings import AppSettings


def load_config_from_yaml(config_path: str = "config.yaml") -> Dict[str, Any]:
    """Load configuration from a YAML file."""
    path = Path(config_path)
    if not path.exists():
        return {}

    with open(path, "r") as f:
        data = yaml.safe_load(f) or {}
    return data


def get_settings() -> AppSettings:
    """
    Load settings from config.yaml and environment variables.
    Priority: environment variables > config.yaml > defaults
    """
    yaml_config = load_config_from_yaml()

    settings = AppSettings(
        app_name=os.getenv("APP_NAME", yaml_config.get("app_name", "Utility API")),
        debug=os.getenv("DEBUG", str(yaml_config.get("debug", False))).lower() == "true",
        host=os.getenv("HOST", yaml_config.get("host", "0.0.0.0")),
        port=int(os.getenv("PORT", yaml_config.get("port", 8000))),
        workers=int(os.getenv("WORKERS", yaml_config.get("workers", 4))),
        groq_api_key=os.getenv("GROQ_API_KEY", yaml_config.get("groq_api_key", "")),
        groq_model=os.getenv(
            "GROQ_MODEL", yaml_config.get("groq_model", "llama-3.3-70b-versatile")
        ),
    )

    settings.validate_required_env_vars()
    return settings


# Singleton instance
_settings = None


def init_config() -> AppSettings:
    """Initialize and return the global settings instance."""
    global _settings
    if _settings is None:
        _settings = get_settings()
    return _settings


def get_app_settings() -> AppSettings:
    """Get the current application settings."""
    global _settings
    if _settings is None:
        _settings = get_settings()
    return _settings
