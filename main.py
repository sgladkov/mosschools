from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


app = FastAPI()
templates = Jinja2Templates(directory="")

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


@app.get("/school/", response_class=HTMLResponse)
async def show_school(school_id: int, request:Request, db: Session = Depends(get_db)):
    school = db.query(models.School).filter(models.School.id == school_id).first()
    if school_id <= 0:
        raise HTTPException(status_code=404, detail="Id must be positive number! ")
    if school is None:
        raise HTTPException(status_code=404, detail="No such id for school")
    return templates.TemplateResponse("index.html", {"request": request, "schools": [school]})


@app.get("/list/", response_class=HTMLResponse)
async def show_list(start: int, end: int, request:Request, db: Session = Depends(get_db)):
    if start <= 0:
        raise HTTPException(status_code=404, detail="Start must be positive number!")
    if end > len(db.query(models.School).all()):
        raise HTTPException(status_code=404, detail="Out of index!")
    if start > end:
        raise HTTPException(status_code=404, detail="Start after end!")
    schools = db.query(models.School).all()
    return templates.TemplateResponse("index.html", {"request": request, "schools": schools[start-1:end]})


@app.get("/count/")
def show_amount():
    db = SessionLocal()
    amount = len(db.query(models.School).all())
    return amount
