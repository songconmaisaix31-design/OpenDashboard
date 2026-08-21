from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def repository_root() -> Path:
    return Path(__file__).resolve().parents[3]


@pytest.fixture(scope="session")
def fixtures_dir() -> Path:
    return Path(__file__).resolve().parent / "fixtures"


@pytest.fixture(scope="session")
def valid_csv(fixtures_dir: Path) -> str:
    return (fixtures_dir / "tiny-valid-timeseries.csv").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def invalid_csv(fixtures_dir: Path) -> str:
    return (fixtures_dir / "tiny-invalid-timeseries.csv").read_text(encoding="utf-8")
