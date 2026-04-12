"""SportShield AI — Storage abstraction (local filesystem / AWS S3)."""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class StorageBackend:
    """Abstract interface for file storage operations."""

    async def upload(self, file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
        """Upload a file and return (storage_key, storage_url)."""
        raise NotImplementedError

    async def download(self, storage_key: str) -> bytes:
        """Download a file by its storage key."""
        raise NotImplementedError

    async def delete(self, storage_key: str) -> None:
        """Delete a file by its storage key."""
        raise NotImplementedError

    async def get_url(self, storage_key: str) -> str:
        """Get a public/presigned URL for a file."""
        raise NotImplementedError


class LocalStorage(StorageBackend):
    """Local filesystem storage backend for development."""

    def __init__(self):
        self.base_path = Path(settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def upload(self, file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
        ext = Path(filename).suffix
        storage_key = f"{uuid.uuid4().hex}{ext}"
        file_path = self.base_path / storage_key
        file_path.write_bytes(file_bytes)
        storage_url = f"/uploads/{storage_key}"
        return storage_key, storage_url

    async def download(self, storage_key: str) -> bytes:
        file_path = self.base_path / storage_key
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {storage_key}")
        return file_path.read_bytes()

    async def delete(self, storage_key: str) -> None:
        file_path = self.base_path / storage_key
        if file_path.exists():
            file_path.unlink()

    async def get_url(self, storage_key: str) -> str:
        return f"/uploads/{storage_key}"


class S3Storage(StorageBackend):
    """AWS S3 storage backend for production."""

    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        self.bucket = settings.AWS_S3_BUCKET

    async def upload(self, file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
        ext = Path(filename).suffix
        storage_key = f"assets/{uuid.uuid4().hex}{ext}"
        self.client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        storage_url = f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{storage_key}"
        return storage_key, storage_url

    async def download(self, storage_key: str) -> bytes:
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=storage_key)
            return response["Body"].read()
        except ClientError as e:
            raise FileNotFoundError(f"S3 file not found: {storage_key}") from e

    async def delete(self, storage_key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=storage_key)

    async def get_url(self, storage_key: str) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=3600,
        )


def get_storage() -> StorageBackend:
    """Factory function to get the configured storage backend."""
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage()
    return LocalStorage()


storage = get_storage()
