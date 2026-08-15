from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/Tutoring_Hub_db"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    frontend_origins: str = "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@tutorhub-uae.com"
    smtp_use_tls: bool = True

    admin_notification_email: str = "admin@tutorhub-uae.com"

    seed_admin_email: str = "admin@tutorhub-uae.com"
    seed_admin_password: str = "ChangeMe123!"
    seed_admin_name: str = "Site Administrator"

    upload_dir: str = "static/uploads"
    max_upload_mb: int = 5

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
