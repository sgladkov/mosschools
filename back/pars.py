import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
models.Base.metadata.create_all(bind=engine)

def add_school(name: str, fullname:str, address: str, coords: str, orgtype:str, admarea:str, district:str, site: str, chiefpos:str, chief:str, phone: str, avgrating:float, sprrating:str, description: str =''):
    db = SessionLocal()
    try:
        db_user = models.School(name=name, fullname=fullname, address=address, coords=coords, orgtype=orgtype, admarea=admarea, district=district, site=site, chiefpos=chiefpos, chief=chief, phone = phone, avgrating=avgrating, sprrating=sprrating, description = description)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    finally:
        db.close()


with open('data/scools.json', 'r', encoding="UTF-8") as f:
    schools = json.load(f)
with open('data/rating.json', 'r', encoding="UTF-8") as f:
    ratings = json.load(f)
counter = 0
for txt in schools:
    counted = False
    rating_info = ''
    rating_avg = 0
    rate_count = 0
    total_rating = 0
    for rating in ratings:
        if str(txt['FullName']) == str(rating['EDU_NAME']):
            rate_count += 1
            if not counted:
                counted = True
                counter += 1
            if float(rating['PASSER_UNDER_160']) != 0:
                rating_avg  += float(rating['PASSES_OVER_220']) / float(rating['PASSER_UNDER_160'])
                rating_info += f"Рейтинг в {str(rating['YEAR'])} годах: {round(float(rating['PASSES_OVER_220']) / float(rating['PASSER_UNDER_160']), 2)}<br> "
            else:
                rating_avg += 1
                rating_info += f"Рейтинг в {str(rating['YEAR'])} годах: 1 <br>"
            # print(f'{str(txt["FullName"])} {str(rating["EDU_NAME"])}, сходство найдено')
    if rate_count != 0:
        total_rating = round(rating_avg/rate_count, 2)
    if rating_info == '':
        rating_info = 'Неизвестно'
    add_school(str(txt['ShortName']), str(txt['FullName']), str(txt['LegalAddress']), str(txt['geoData']), str(txt['OrgType']), str(txt['InstitutionsAddresses'][0]['AdmArea']), str(txt['InstitutionsAddresses'][0]['District']), str(txt['WebSite']), str(txt['InstitutionsAddresses'][0]['ChiefPosition']), str(txt['InstitutionsAddresses'][0]['ChiefName']), str(txt['PublicPhone'][0]['PublicPhone']), total_rating, rating_info)
