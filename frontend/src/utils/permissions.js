/**
 * permissions.js — Single source of truth for frontend RBAC
 * =============================================================
 * Mirrors the backend RBAC in views.py exactly.
 *
 * Roles:
 *   mla          → SuperUser  — full read/write/admin, all wards & booths
 *   pa           → SuperUser  — full read/write/admin (Office P.A)
 *   corporator   → Write own ward only; READ all wards & booths (visibility)
 *   booth_worker → Write own booth only; READ all wards & booths (visibility)
 */

// ── Role helpers ──────────────────────────────────────────────────────────────

export const ROLE_LABELS = {
  mla:          'MLA',
  pa:           'Office P.A',
  corporator:   'Corporator',
  booth_worker: 'Booth Worker',
};

export const ROLE_COLORS = {
  mla:          '#f59e0b',
  pa:           '#f59e0b',
  corporator:   '#22d3ee',
  booth_worker: '#10b981',
};

export const ROLE_DESCRIPTIONS = {
  mla:          'Full access — all wards, booths & admin panel',
  pa:           'Full admin access on behalf of MLA',
  corporator:   'Write access for assigned ward · Read-only all other wards',
  booth_worker: 'Write access for assigned booth · Read-only all other booths',
};

// ── Core permission checks — mirror views.py exactly ─────────────────────────

/** MLA and PA are superusers with unrestricted access. */
export function isSuperuser(user) {
  return !!user && (user.role === 'mla' || user.role === 'pa');
}

/** Only superusers may access the Admin Panel. */
export function canAccessAdmin(user) {
  return isSuperuser(user);
}

/**
 * Can the user WRITE (create/update survey records) for a given ward?
 *   - Superusers: yes, any ward
 *   - Corporator: only their assigned ward (case-insensitive)
 *   - Booth worker: no ward-level write
 */
export function canWriteWard(user, ward) {
  if (!user || user.status !== 'approved') return false;
  if (isSuperuser(user)) return true;
  if (user.role === 'corporator') {
    return String(user.ward || '').toUpperCase() === String(ward || '').toUpperCase();
  }
  return false; // booth_worker has no ward-level write
}

/**
 * Can the user WRITE (create/update survey records) for a given booth?
 *   - Superusers: yes, any booth
 *   - Corporator: yes, any booth within their ward (ward check is separate)
 *   - Booth worker: only their assigned booth
 */
export function canWriteBooth(user, booth) {
  if (!user || user.status !== 'approved') return false;
  if (isSuperuser(user)) return true;
  if (user.role === 'corporator') return true; // within their ward
  if (user.role === 'booth_worker') {
    return String(user.booth || '') === String(booth || '');
  }
  return false;
}

/**
 * Can the user READ data for a given ward?
 * ALL approved users can READ all wards — only WRITE is restricted.
 */
export function canReadWard(user) {
  return !!user && user.status === 'approved';
}

/**
 * Can the user READ data for a given booth?
 * ALL approved users can READ all booths — only WRITE is restricted.
 */
export function canReadBooth(user) {
  return !!user && user.status === 'approved';
}

/**
 * Can the user start/submit a survey for a specific voter in this ward+booth?
 * Combines ward AND booth write checks.
 */
export function canSurveyVoter(user, wardName, boothNo) {
  if (!user || user.status !== 'approved') return false;
  if (isSuperuser(user)) return true;

  if (user.role === 'corporator') {
    // Must be their ward; booth is automatically in scope
    return canWriteWard(user, wardName);
  }
  if (user.role === 'booth_worker') {
    return canWriteBooth(user, boothNo);
  }
  return false;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable scope label for the user's access level.
 * Used in tooltips and access-denied messages.
 */
export function accessScopeLabel(user) {
  if (!user) return 'Not authenticated';
  if (isSuperuser(user)) return 'Full access — all wards & booths';
  if (user.role === 'corporator') {
    return `Write: Ward ${user.ward || '?'} · Read: all wards`;
  }
  if (user.role === 'booth_worker') {
    return `Write: Booth ${user.booth || '?'} · Read: all booths`;
  }
  return 'No write access';
}

/**
 * Returns the lock tooltip text shown on survey buttons the user can't click.
 */
export function noWriteReason(user, wardName, boothNo) {
  if (!user) return 'Login required';
  if (user.status !== 'approved') return 'Account pending approval';
  if (user.role === 'corporator') {
    return `Write access limited to Ward ${user.ward} only`;
  }
  if (user.role === 'booth_worker') {
    return `Write access limited to Booth ${user.booth} only`;
  }
  return 'No write access';
}