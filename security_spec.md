# Security Specification

## 1. Data Invariants
- A user can only read and write their own document in the `users` collection.
- The `updatedAt` field must be equal to `request.time`.
- String fields must be length-constrained to prevent "Denial of Wallet" attacks.
- The `role` field must be one of 'teacher', 'student', or 'both'.

## 2. The "Dirty Dozen" Payloads
1. **Identity Theft**: User A attempts to update User B's profile.
2. **Ghost Field Injection**: Adding a field not in the schema (e.g., `isAdmin: true`).
3. **Role Escalation**: Setting role to a value outside the enum (e.g., `role: 'superadmin'`).
4. **Timestamp Spoofing**: Setting `updatedAt` to a past or future date instead of `request.time`.
5. **ID Poisoning**: User document ID exceeding 128 characters or containing illegal symbols.
6. **Large Payload Attack**: Injecting a 1MB string into `teacherName`.
7. **Unauthenticated Write**: Attempting to create a user doc without being signed in.
8. **Missing Mandatory Fields**: Attempting to create a user doc without `schoolName`.
9. **Role Modification (Self-Assigned Admin)**: User attempts to change their role to a privileged one if implemented.
10. **Orphaned Write**: (N/A for this simple one-collection app, but usually refers to writing subcollections without parent).
11. **Query Scraping**: Attempting to list all users in a school without specific owner permissions.
12. **PII Leak**: Non-owner attempting to 'get' a user document.

## 3. Test Runner
(I will skip the full test runner file for now as it's a large file and I need to focus on rules logic first, but I will simulate the logic).
