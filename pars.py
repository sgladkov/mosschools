import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
models.Base.metadata.create_all(bind=engine)

def add_school(name: str, address: str, coords: str, district:str, site: str, chiefpos:str, chief:str, phone: str, description: str =''):
    db = SessionLocal()
    try:
        db_user = models.School(name=name, address=address, coords=coords, district=district, site=site, chiefpos=chiefpos, chief=chief, phone = phone, description = description)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    finally:
        db.close()


with open('data/scools.json', 'r', encoding="UTF-8") as f:
    templates = json.load(f)

for txt in templates:
    add_school(str(txt['ShortName']), str(txt['LegalAddress']), str(txt['geoData']), str(txt['InstitutionsAddresses'][0]['District']), str(txt['WebSite']), str(txt['InstitutionsAddresses'][0]['ChiefPosition']), str(txt['InstitutionsAddresses'][0]['ChiefName']), str(txt['PublicPhone'][0]['PublicPhone']))