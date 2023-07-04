import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
models.Base.metadata.create_all(bind=engine)

def add_school(name: str, fullname:str, address: str, coords: str, orgtype:str, admarea:str, district:str, site: str, chiefpos:str, chief:str, phone: str, avgrating:float, sprrating:str, eduprogs:str, description: str =''):
    db = SessionLocal()
    try:
        db_user = models.School(name=name, fullname=fullname, address=address, coords=coords, orgtype=orgtype, admarea=admarea, district=district, site=site, chiefpos=chiefpos, chief=chief, phone = phone, avgrating=avgrating, sprrating=sprrating, eduprogs=eduprogs, description = description)
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

    url = f'https://{str(txt["WebSite"])}'    
    driver = webdriver.Chrome()  # Инициализация браузера
    driver.get(url)  # Загрузка страницы
    driver.implicitly_wait(1)  # Ожидание 10 секунд, пока страница загрузится

    # Получение HTML-кода страницы после загрузки контента JavaScript
    html = driver.execute_script("return document.documentElement.outerHTML")

    # Инициализация объекта BeautifulSoup для парсинга HTML-кода страницы
    soup = BeautifulSoup(html, "html.parser")
    
    # Получение элементов на странице
    div_with_class = soup.findAll("div", {"class": "app-slider-box-slid-director"})
    all_dis = ''
    
    meta_tags = soup.find_all("meta", {"name": "description"})
    for tag in meta_tags:
        if "content" in tag.attrs:
            all_dis += tag['content']
    for div in div_with_class:
        p_tags = div.find_all("p")
        for p in p_tags:
            all_dis += p.text
    driver.quit()  # Закрытие браузера
    
    
    add_school(str(txt['ShortName']), str(txt['FullName']), str(txt['LegalAddress']), str(txt['geoData']), str(txt['OrgType']), str(txt['InstitutionsAddresses'][0]['AdmArea']), str(txt['InstitutionsAddresses'][0]['District']), str(txt['WebSite']), str(txt['InstitutionsAddresses'][0]['ChiefPosition']), str(txt['InstitutionsAddresses'][0]['ChiefName']), str(txt['PublicPhone'][0]['PublicPhone']), total_rating, rating_info, str(txt['EducationPrograms']), description=str(all_dis))
