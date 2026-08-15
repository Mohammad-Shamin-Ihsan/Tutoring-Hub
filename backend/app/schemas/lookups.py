import uuid

from pydantic import BaseModel, ConfigDict, Field


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class LocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    city: str
    area: str


class LocationCreate(BaseModel):
    city: str = Field(min_length=1, max_length=100)
    area: str = Field(min_length=1, max_length=100)


class LanguageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class LanguageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class TeachingLevelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    level_name: str


class TeachingLevelCreate(BaseModel):
    level_name: str = Field(min_length=1, max_length=100)
