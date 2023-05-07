import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
models.Base.metadata.create_all(bind=engine)

def add_school(name: str, address: str, coords: str):
    db = SessionLocal()
    try:
        db_user = models.School(name=name, address=address, coords=coords)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    finally:
        db.close()


with open('data/scools.json', 'r', encoding="UTF-8") as f:
    templates = json.load(f)

for txt in templates:
    add_school(str(txt['ShortName']), str(txt['LegalAddress']), str(txt['geoData'])) # Name? || geoData ~ string
    print(txt['ShortName'], txt['LegalAddress'])
    









