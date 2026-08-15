"""baseline - schema created by database/schema.sql

Revision ID: 0001_baseline
Revises:
Create Date: 2026-08-15

This revision intentionally does nothing. The initial schema is created by
running database/schema.sql directly against Tutoring_Hub_db; this file just
gives Alembic a baseline to `stamp` so future schema changes can go through
normal `alembic revision --autogenerate` migrations from here on.
"""
from typing import Sequence, Union

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
