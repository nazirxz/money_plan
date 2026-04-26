export interface CoupleMember {
  username: string;
  name: string;
  color: string;
}

export const COUPLE: Record<string, CoupleMember> = {
  nazirxz: { username: 'nazirxz', name: 'Nazir', color: '#0ea5e9' },
  richan: { username: 'richan', name: 'Richan', color: '#ec4899' },
};

export const EMAIL_DOMAIN = 'money.app';

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@${EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return '';
  return email.split('@')[0].toLowerCase();
}

export function getMember(emailOrUsername: string | null | undefined): CoupleMember | null {
  if (!emailOrUsername) return null;
  const u = emailOrUsername.includes('@') ? emailToUsername(emailOrUsername) : emailOrUsername.toLowerCase();
  return COUPLE[u] ?? null;
}

export function getDisplayName(emailOrUsername: string | null | undefined): string {
  const m = getMember(emailOrUsername);
  if (m) return m.name;
  if (!emailOrUsername) return '?';
  const u = emailToUsername(emailOrUsername) || emailOrUsername;
  return u.charAt(0).toUpperCase() + u.slice(1);
}

export function getMemberColor(emailOrUsername: string | null | undefined): string {
  return getMember(emailOrUsername)?.color ?? '#64748b';
}

export function getPartner(emailOrUsername: string | null | undefined): CoupleMember | null {
  const me = getMember(emailOrUsername);
  if (!me) return null;
  const others = Object.values(COUPLE).filter((m) => m.username !== me.username);
  return others[0] ?? null;
}

/** Warna badge untuk label nama yang disimpan di `transactions.creator_name`. */
export function getColorByMemberName(displayName: string | null | undefined): string {
  if (!displayName) return '#64748b';
  const m = Object.values(COUPLE).find((c) => c.name === displayName);
  return m?.color ?? '#64748b';
}
