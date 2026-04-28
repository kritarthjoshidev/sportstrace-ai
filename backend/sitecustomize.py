from __future__ import annotations

import sys
from pathlib import Path


# When commands are launched from inside `backend/`, Python only sees that
# directory on sys.path. Add the repo root so imports like `backend.main:app`
# still resolve correctly for uvicorn reload workers.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
project_root_str = str(PROJECT_ROOT)

if project_root_str not in sys.path:
    sys.path.insert(0, project_root_str)
