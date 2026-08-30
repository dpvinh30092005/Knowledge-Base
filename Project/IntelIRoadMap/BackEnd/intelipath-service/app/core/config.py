from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelipath AI Service"
    API_V1_STR: str = "/api"

    class Config:
        case_sensitive = True

settings = Settings()
