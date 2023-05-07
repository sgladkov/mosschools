from sqlalchemy import Column, Integer, String
from database import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    coords = Column(String, index=True)
    district = Column(String, index=True)
    address = Column(String, index=True)
    site = Column(String, index=True)
    chiefpos = Column(String, index=True)
    chief = Column(String, index=True)

    phone = Column(String, index=True)
    description = Column(String, default='', index=True)