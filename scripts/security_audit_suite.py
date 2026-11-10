#!/usr/bin/env python3
"""
WAS Jobs Ethiopia - Comprehensive Stage 2 Security Audit Test Suite
Tests:
- Bcrypt password hashing
- Legacy SHA-256 automatic migration
- Server-side role enforcement
- Role tampering prevention on user profile
- Admin elevation restrictions
- Token generation, timing-safe verification, tampering rejection
- Token invalidation on password reset
- Token revocation on logout
- Brute force login rate limiting & lockout
- Demo-login admin rejection
"""

import urllib.request
import urllib.error
import json
import time
import hashlib
import sys

BASE_URL = "http://localhost:3000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json", "User-Agent": "SecurityAuditRunner/2.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            res_body = res.read().decode("utf-8")
            try:
                parsed = json.loads(res_body)
            except Exception:
                parsed = res_body
            return res.status, parsed
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

results = []

def record(test_num, name, passed, details):
    status = "PASS" if passed else "FAIL"
    results.append({"num": test_num, "name": name, "passed": passed, "details": details})
    print(f"[{status}] Test {test_num}: {name} - {details}")

# 1. Registration Role Escalation Restriction
status, res = make_req("/auth/register", "POST", {
    "fullName": "Malicious User",
    "email": f"hacker_{int(time.time())}@audit.test",
    "password": "TestPassword123!",
    "role": "admin"
})
passed = (status == 400 and "Invalid role" in str(res))
err_msg = res.get('error', res) if isinstance(res, dict) else res
record(1, "Registration Role Elevation Prevention", passed, f"Status: {status}, Response: {err_msg}")

# 2. Registration with Valid Seeker
seeker_email = f"audit_seeker_{int(time.time())}@audit.test"
status, res = make_req("/auth/register", "POST", {
    "fullName": "Audit Test Seeker",
    "email": seeker_email,
    "password": "SecurePassword123!",
    "role": "seeker"
})
seeker_token = res.get("token") if isinstance(res, dict) else None
seeker_id = res.get("user", {}).get("id") if isinstance(res, dict) else None
has_hash_in_res = "passwordHash" in str(res)
passed = (status == 201 and seeker_token is not None and not has_hash_in_res)
record(2, "Valid Seeker Registration & Password Hash Exposure Check", passed, f"Status: {status}, Token issued: {bool(seeker_token)}, Sensitive Hash exposed in response: {has_hash_in_res}")

# 3. Verify Bcrypt Hashing in Database
try:
    with open("data/db.json", "r") as f:
        db = json.load(f)
    user_in_db = next((u for u in db.get("users", []) if u.get("email") == seeker_email), None)
    stored_hash = user_in_db.get("passwordHash", "") if user_in_db else ""
    is_bcrypt = stored_hash.startswith("$2a$") or stored_hash.startswith("$2b$")
    record(3, "Bcrypt Password Hashing Format ($2b$/$2a$)", is_bcrypt, f"Stored hash prefix: {stored_hash[:7]} (length: {len(stored_hash)})")
except Exception as e:
    record(3, "Bcrypt Password Hashing Format", False, f"Error reading DB: {e}")

# 4. Legacy SHA-256 Password Migration Verification
legacy_email = f"legacy_user_{int(time.time())}@audit.test"
legacy_pwd = "LegacySecretPass2025!"
legacy_salt = "_was_salt_2025"
legacy_sha = hashlib.sha256((legacy_pwd + legacy_salt).encode("utf-8")).hexdigest()
try:
    with open("data/db.json", "r") as f:
        db = json.load(f)
    legacy_user = {
        "id": f"usr_legacy_{int(time.time())}",
        "email": legacy_email,
        "passwordHash": legacy_sha,
        "fullName": "Legacy Account",
        "role": "seeker",
        "phone": "0911000000",
        "location": "Addis Ababa",
        "skills": [],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
    db["users"].append(legacy_user)
    with open("data/db.json", "w") as f:
        json.dump(db, f, indent=2)

    # Login with legacy credentials
    l_status, l_res = make_req("/auth/login", "POST", {
        "email": legacy_email,
        "password": legacy_pwd
    })
    l_token = l_res.get("token") if isinstance(l_res, dict) else None

    # Inspect DB after login
    with open("data/db.json", "r") as f:
        db_after = json.load(f)
    migrated_u = next((u for u in db_after.get("users", []) if u.get("email") == legacy_email), None)
    new_hash = migrated_u.get("passwordHash", "") if migrated_u else ""
    migrated_to_bcrypt = new_hash.startswith("$2a$") or new_hash.startswith("$2b$")
    passed = (l_status == 200 and l_token is not None and migrated_to_bcrypt)
    record(4, "Legacy SHA-256 Hash Auto-Migration to Bcrypt on Login", passed, f"Status: {l_status}, Migrated to bcrypt: {migrated_to_bcrypt}, New prefix: {new_hash[:7]}")
except Exception as e:
    record(4, "Legacy SHA-256 Hash Auto-Migration to Bcrypt on Login", False, f"Exception: {e}")

# 5. Role Tampering Prevention on Profile Update
status, res = make_req("/users/profile", "PUT", {
    "fullName": "Hacked Profile",
    "role": "admin"
}, token=seeker_token)
with open("data/db.json", "r") as f:
    db_check = json.load(f)
seeker_check = next((u for u in db_check.get("users", []) if u.get("id") == seeker_id), None)
role_unchanged = (seeker_check.get("role") == "seeker") if seeker_check else False
passed = (status == 200 and role_unchanged and res.get("user", {}).get("role") == "seeker")
record(5, "User Role Tampering Prevention (PUT /profile)", passed, f"Status: {status}, Current role in DB: {seeker_check.get('role')}")

# 6. Unauthorized Admin Route Access
status, res = make_req("/users/admin-list", "GET", token=seeker_token)
passed = (status == 403)
record(6, "Unauthorized Access to Admin Route (/users/admin-list)", passed, f"Status: {status}, Expected: 403 Forbidden")

# 7. Unauthorized Role Change by Non-Admin
status, res = make_req(f"/users/{seeker_id}/role", "PATCH", {"role": "admin"}, token=seeker_token)
passed = (status == 403)
record(7, "Unauthorized Role Modification Endpoint Protection", passed, f"Status: {status}, Expected: 403 Forbidden")

# 8. Admin Demo-Login Lockdown
status, res = make_req("/auth/demo-login", "POST", {"role": "admin"})
passed = (status == 403 and "Admin access requires password" in str(res))
record(8, "Demo-Login Admin Bypass Lockdown", passed, f"Status: {status}, Blocked: {passed}")

# 9. Token Signature Tampering Defense
tampered_token = seeker_token[:-3] + ("A" if seeker_token[-1] != "A" else "B")
status, res = make_req("/users/profile", "GET", token=tampered_token)
passed = (status == 401)
record(9, "Timing-Safe Cryptographic Signature Verification", passed, f"Status: {status}, Expected: 401 Unauthorized")

# 10. Token Invalidation Across Sessions on Password Reset
status, res = make_req("/auth/reset-password", "POST", {
    "email": seeker_email,
    "newPassword": "NewSecurePassword456!"
})
time.sleep(0.1)
# Now test old token
old_status, old_res = make_req("/users/profile", "GET", token=seeker_token)
passed = (status == 200 and old_status == 401)
record(10, "Token Invalidation Upon Password Reset", passed, f"Reset status: {status}, Old token status: {old_status} (Expected: 401)")

# 11. Login with New Password & Token Revocation on Logout
status, res = make_req("/auth/login", "POST", {
    "email": seeker_email,
    "password": "NewSecurePassword456!"
})
new_token = res.get("token") if isinstance(res, dict) else None
status_logout, res_logout = make_req("/auth/logout", "POST", token=new_token)
status_after_logout, res_after = make_req("/users/profile", "GET", token=new_token)
passed = (status == 200 and status_logout == 200 and status_after_logout == 401)
record(11, "Server-Side Token Revocation on Logout", passed, f"Login: {status}, Logout: {status_logout}, After Logout: {status_after_logout} (Expected: 401)")

# 12. Brute Force Login Rate Limiter (Lockout after 5 failed attempts)
brute_email = f"brute_victim_{int(time.time())}@audit.test"
# Register victim user
make_req("/auth/register", "POST", {
    "fullName": "Victim User",
    "email": brute_email,
    "password": "CorrectPassword123!",
    "role": "seeker"
})
statuses = []
for i in range(6):
    s, r = make_req("/auth/login", "POST", {
        "email": brute_email,
        "password": "WrongPasswordAttempt!"
    })
    statuses.append(s)

passed = (429 in statuses)
record(12, "Brute-Force Rate Limiter & Account Lockout (5 failures -> 429)", passed, f"Response sequence: {statuses}")

# Clean up test accounts from data/db.json
try:
    with open("data/db.json", "r") as f:
        clean_db = json.load(f)
    clean_db["users"] = [u for u in clean_db.get("users", []) if "@audit.test" not in u.get("email", "")]
    with open("data/db.json", "w") as f:
        json.dump(clean_db, f, indent=2)
except Exception as e:
    pass

print("\n" + "=" * 60)
total_tests = len(results)
passed_tests = sum(1 for r in results if r["passed"])
print(f"AUDIT SUMMARY: {passed_tests}/{total_tests} CHECKS PASSED.")
if passed_tests == total_tests:
    print("ALL CORE SECURITY CHECKS VERIFIED SUCCESSFULLY.")
else:
    print("WARNING: SOME CHECKS FAILED.")
    sys.exit(1)
