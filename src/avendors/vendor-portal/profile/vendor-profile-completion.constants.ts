/**
 * Weighted checklist used by {@link computeProfileCompletion}. Weights sum to
 * 100 so the frontend can render a straight percent bar. Keys are stable so
 * clients can localize / icon-map them.
 */
export interface ProfileCompletionRule {
  key: string;
  label: string;
  weight: number;
}

export const PROFILE_COMPLETION_RULES: ProfileCompletionRule[] = [
  { key: 'company_basic', label: 'Company name, industry, phone', weight: 20 },
  { key: 'company_address', label: 'Address, city, country', weight: 15 },
  { key: 'bank_details', label: 'Bank account details', weight: 20 },
  { key: 'compliance_valid', label: 'At least one valid compliance document', weight: 25 },
  { key: 'compliance_not_expiring', label: 'All compliance documents not expired', weight: 10 },
  { key: 'email_confirmed', label: 'Login email on file', weight: 10 },
];

export interface ProfileCompletionInput {
  vendor: {
    name: string | null;
    industry: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  hasBank: boolean;
  documents: { status: string; expiresAt: Date | null }[];
  userEmail: string | null;
}

export interface ProfileCompletionResult {
  completionPercent: number;
  completedItems: string[];
  missingItems: string[];
}

export function computeProfileCompletion(
  input: ProfileCompletionInput,
): ProfileCompletionResult {
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  const check = (rule: ProfileCompletionRule, pass: boolean) => {
    if (pass) {
      score += rule.weight;
      completed.push(rule.key);
    } else {
      missing.push(rule.key);
    }
  };

  const v = input.vendor;
  check(
    PROFILE_COMPLETION_RULES[0],
    Boolean(v.name?.trim()) && Boolean(v.industry?.trim()) && Boolean(v.phone?.trim()),
  );
  check(
    PROFILE_COMPLETION_RULES[1],
    Boolean(v.address?.trim()) && Boolean(v.city?.trim()) && Boolean(v.country?.trim()),
  );
  check(PROFILE_COMPLETION_RULES[2], input.hasBank);

  const hasValid = input.documents.some((d) => d.status === 'valid');
  check(PROFILE_COMPLETION_RULES[3], hasValid);

  const now = Date.now();
  const allNotExpired =
    input.documents.length > 0 &&
    input.documents.every(
      (d) => !d.expiresAt || new Date(d.expiresAt).getTime() > now,
    );
  check(PROFILE_COMPLETION_RULES[4], allNotExpired);

  check(PROFILE_COMPLETION_RULES[5], Boolean(input.userEmail?.trim()));

  return {
    completionPercent: Math.min(100, Math.max(0, Math.round(score))),
    completedItems: completed,
    missingItems: missing,
  };
}
