"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-09 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'uploaded_files',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_format', sa.String(length=50), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('feature_count', sa.Integer(), nullable=False),
        sa.Column('polygon_count', sa.Integer(), nullable=False),
        sa.Column('linestring_count', sa.Integer(), nullable=False),
        sa.Column('point_count', sa.Integer(), nullable=False),
        sa.Column('other_count', sa.Integer(), nullable=False),
        sa.Column('successful_measurements', sa.Integer(), nullable=False),
        sa.Column('failed_measurements', sa.Integer(), nullable=False),
        sa.Column('source_crs', sa.String(length=100), nullable=False),
        sa.Column('measurement_crs', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('bbox_min_x', sa.Float(), nullable=True),
        sa.Column('bbox_min_y', sa.Float(), nullable=True),
        sa.Column('bbox_max_x', sa.Float(), nullable=True),
        sa.Column('bbox_max_y', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_uploaded_files_created_at', 'uploaded_files', ['created_at'], unique=False)
    op.create_index('ix_uploaded_files_status', 'uploaded_files', ['status'], unique=False)

    op.create_table(
        'feature_measurements',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('file_id', sa.String(length=36), nullable=False),
        sa.Column('feature_id', sa.String(length=100), nullable=False),
        sa.Column('geometry_type', sa.String(length=50), nullable=False),
        sa.Column('measurement_type', sa.String(length=50), nullable=False),
        sa.Column('measurement_value', sa.Float(), nullable=True),
        sa.Column('measurement_unit', sa.String(length=20), nullable=True),
        sa.Column('secondary_value', sa.Float(), nullable=True),
        sa.Column('secondary_unit', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('status_message', sa.Text(), nullable=True),
        sa.Column('properties_data', sa.JSON(), nullable=True),
        sa.Column('geojson_geometry', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['file_id'], ['uploaded_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feature_measurements_file_id', 'feature_measurements', ['file_id'], unique=False)
    op.create_index('ix_feature_measurements_geom_type', 'feature_measurements', ['geometry_type'], unique=False)
    op.create_index('ix_feature_measurements_status', 'feature_measurements', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('feature_measurements')
    op.drop_table('uploaded_files')
