"""SportShield AI — Video keyframe extraction and per-frame hashing."""

import os
import subprocess
import tempfile
from pathlib import Path
from typing import List

import cv2


def extract_keyframes(video_path: str, interval_sec: float = 2.0, max_frames: int = 60) -> List[bytes]:
    """Extract keyframes from a video file at regular intervals.

    Uses OpenCV to read frames at specified intervals.
    Limits to max_frames (first 2 minutes at 2s intervals = 60 frames).

    Args:
        video_path: Path to the video file on disk.
        interval_sec: Seconds between extracted frames.
        max_frames: Maximum number of frames to extract.

    Returns:
        List of JPEG-encoded frame bytes.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0  # fallback

    frame_interval = int(fps * interval_sec)
    frames: List[bytes] = []
    frame_count = 0
    read_count = 0

    while len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if read_count % frame_interval == 0:
            # Encode frame as JPEG bytes
            success, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if success:
                frames.append(buffer.tobytes())
                frame_count += 1

        read_count += 1

    cap.release()
    return frames


def extract_keyframes_ffmpeg(video_path: str, interval_sec: float = 2.0, max_frames: int = 60) -> List[bytes]:
    """Extract keyframes using FFmpeg (alternative to OpenCV).

    Creates temporary JPEG files using ffmpeg CLI,
    reads them back as bytes, then cleans up.

    Args:
        video_path: Path to the video file.
        interval_sec: Seconds between frames.
        max_frames: Maximum frames to extract.

    Returns:
        List of JPEG-encoded frame bytes.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        output_pattern = os.path.join(tmpdir, "frame_%04d.jpg")

        cmd = [
            "ffmpeg",
            "-i", video_path,
            "-vf", f"fps=1/{interval_sec}",
            "-frames:v", str(max_frames),
            "-q:v", "2",
            output_pattern,
            "-y",
            "-loglevel", "error",
        ]

        subprocess.run(cmd, check=True, capture_output=True)

        frames: List[bytes] = []
        frame_files = sorted(Path(tmpdir).glob("frame_*.jpg"))

        for frame_file in frame_files[:max_frames]:
            frames.append(frame_file.read_bytes())

    return frames


def video_match_percentage(match_results: List[bool]) -> float:
    """Calculate the percentage of frames that matched.

    An asset is "matched" if ≥ 30% of frames return a high-confidence hit.

    Args:
        match_results: List of boolean match results per frame.

    Returns:
        Match percentage (0.0 to 100.0).
    """
    if not match_results:
        return 0.0
    return (sum(match_results) / len(match_results)) * 100
