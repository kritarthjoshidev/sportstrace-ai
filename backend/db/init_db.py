from backend.db.base import Base
from backend.db.session import engine
from backend.models import blockchain, detection, hash_record, video  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

