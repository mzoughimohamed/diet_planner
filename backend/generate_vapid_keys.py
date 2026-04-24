"""Run once to generate VAPID keys. Output → paste into .env."""
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

key = ec.generate_private_key(ec.SECP256R1())
pub = key.public_key()

# Private key: raw 32-byte scalar as base64url (no padding)
priv_bytes = key.private_numbers().private_value.to_bytes(32, "big")
priv_b64 = base64.urlsafe_b64encode(priv_bytes).rstrip(b"=").decode()

# Public key: uncompressed EC point (65 bytes) as base64url
pub_bytes = pub.public_bytes(
    serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
)
pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode()

print("# Paste these into .env:")
print(f"VAPID_PRIVATE_KEY={priv_b64}")
print(f"VAPID_PUBLIC_KEY={pub_b64}")
print("VAPID_CLAIMS_SUB=mailto:mohamed.c.mzoughi@gmail.com")
