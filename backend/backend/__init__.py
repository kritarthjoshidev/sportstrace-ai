from __future__ import annotations

from pathlib import Path


# When the current working directory is already `backend/`, importing
# `backend.main` needs a package named `backend` to exist one level deeper.
# Point this package's search path back at the real backend source directory.
_REAL_BACKEND_DIR = Path(__file__).resolve().parent.parent
__path__ = [str(_REAL_BACKEND_DIR)]
