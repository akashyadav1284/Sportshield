"""SportShield AI — AI pipeline package."""

from app.ai.fingerprint import generate_phash, generate_dhash, hamming_distance, compute_phash_score
from app.ai.embeddings import extract_embedding, cosine_similarity
from app.ai.similarity import add_to_index, search_index
from app.ai.video import extract_keyframes
