from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from geopy.distance import geodesic
from fastapi.responses import JSONResponse
import re


app = FastAPI()
templates = Jinja2Templates(directory="../front/templates")
app.mount("/static", StaticFiles(directory="../front/static"), name="static")

models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/schools/", response_class=HTMLResponse)
async def show_schools(request:Request,db: Session = Depends(get_db)):
    amount, schools = len(db.query(models.School).all()), db.query(models.School).all()
    return templates.TemplateResponse("index.html", {"request": request, "amount": str(amount), "schools": schools})


@app.get("/schools_adm/", response_class=HTMLResponse, name='adm')
async def show_areas(area: str, request:Request, db: Session = Depends(get_db)): 
    schools = db.query(models.School).filter(models.School.admarea == area).all()
    data = {}
    for i, school in enumerate(schools):
        data[f's{i}'] = {'id': school.id, 'name': school.name, 'orgtype': school.orgtype, 'admarea': school.admarea, 'district': school.district, 'address': school.address, 'site': school.site}
    return JSONResponse(content=data)


@app.get("/school/", response_class=HTMLResponse)
async def show_school(school_id: int, db: Session = Depends(get_db)):
    school = db.query(models.School).filter(models.School.id == school_id).first()
    if school_id <= 0:
        raise HTTPException(status_code=404, detail="Id must be positive number! ")
    if school is None:
        raise HTTPException(status_code=404, detail="No such id for school")
    data = {'id': school.id, 'name': school.name, 'orgtype': school.orgtype, 'admarea': school.admarea, 'district': school.district, 'address': school.address, 'site': school.site}
    return JSONResponse(content=data)


@app.get("/schoolcoords/")
async def take_coords(school_id: int, db: Session = Depends(get_db)):
    school = db.query(models.School).filter(models.School.id == school_id).first()
    pattern = r'\d+'
    numbers = re.findall(pattern, school.coords)
    lt, lg = f'{numbers[0]}.{numbers[1]}', f'{numbers[2]}.{numbers[3]}'
    if school_id <= 0:
        raise HTTPException(status_code=404, detail="Id must be positive number! ")
    if school is None:
        raise HTTPException(status_code=404, detail="No such id for school")
    data = {'coords':{'lt':float(lt), 'lg':float(lg)}, 'name': school.name, 'fullname': school.fullname, 'admarea':school.admarea, 'district': school.district, 'address':school.address, 'site': school.site, 'chiefpos': school.chiefpos, 'chief': school.chief, 'phone': school.phone}
    return JSONResponse(content=data)


@app.get("/count/")
def show_amount():
    db = SessionLocal()
    amount = len(db.query(models.School).all())
    data = {'amount': amount}
    return JSONResponse(content=data)


@app.get("/list/", response_class=HTMLResponse)
async def show_list(start:int=1, db: Session = Depends(get_db), end:int=-1):
    if start <= 0:
        raise HTTPException(status_code=404, detail="Start must be positive number!")
    if end > len(db.query(models.School).all()):
        raise HTTPException(status_code=404, detail="Out of index!")
    schools = db.query(models.School).all()
    schools = schools[start-1:end]
    data = {}
    for i, school in enumerate(schools):
        data[f's{i}'] = {'id': school.id, 'name': school.name, 'orgtype': school.orgtype, 'admarea': school.admarea, 'district': school.district, 'address': school.address, 'site': school.site}
    return JSONResponse(content=data)


@app.get("/schools-in-radius")
def get_schools_in_radius(lat: float, lng: float, radius: int, db: Session = Depends(get_db)):
    data = {}
    pattern = r'\d+'
    for i, school in enumerate(db.query(models.School).all()):
        numbers = re.findall(pattern, school.coords)
        lt, lg = f'{numbers[0]}.{numbers[1]}', f'{numbers[2]}.{numbers[3]}'
        distance_to_school = distance(lat, lng, lt, lg)
        if distance_to_school <= radius:
            data[f's{i}'] = {'name':school.name,'address':school.address, 'coords':{'lt':float(lt), 'lg':float(lg)}}
    return JSONResponse(content=data)


def distance(lat1, lng1, lat2, lng2):
    
    coord1 = (lat1, lng1)
    coord2 = (lat2, lng2)
    return geodesic(coord1, coord2).meters