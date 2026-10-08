from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://patients:patients@localhost:5432/patients"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()