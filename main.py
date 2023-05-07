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
async def show_schools(request:Request):
    db = SessionLocal()
    amount, schools = len(db.query(models.School).all()), db.query(models.School).all()
    return templates.TemplateResponse("index.html", {"request": request, "amount": str(amount), "schools": schools})

@app.get("/schools/{school_id}")
def read_user(school_id: int, db: Session = Depends(get_db)):
    user = db.query(models.School).filter(models.School.id == school_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="School is ehh")
    return user