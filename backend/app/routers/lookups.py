from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models.lookups import Language, Location, Subject, TeachingLevel
from app.schemas.lookups import LanguageOut, LocationOut, SubjectOut, TeachingLevelOut

router = APIRouter(prefix="/api", tags=["lookups"])


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.name).all()


@router.get("/locations", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).order_by(Location.city, Location.area).all()


@router.get("/languages", response_model=list[LanguageOut])
def list_languages(db: Session = Depends(get_db)):
    return db.query(Language).order_by(Language.name).all()


@router.get("/teaching-levels", response_model=list[TeachingLevelOut])
def list_teaching_levels(db: Session = Depends(get_db)):
    return db.query(TeachingLevel).order_by(TeachingLevel.level_name).all()
