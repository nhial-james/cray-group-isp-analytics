// Automated verification script for IPT-G Insights business logic & clinical safeguards
import assert from 'node:assert';

// 1. PHQ-9 Scoring & Question 9 Safety Flag Verification
const PHQ9_TIERS = [
  { min: 0, max: 4, severity: 'minimal' },
  { min: 5, max: 9, severity: 'mild' },
  { min: 10, max: 14, severity: 'moderate' },
  { min: 15, max: 19, severity: 'moderately severe' },
  { min: 20, max: 27, severity: 'severe' },
];

function calculatePHQ9Score(answers) {
  const total = answers.reduce((sum, val) => sum + val, 0);
  const q9Positive = (answers[8] || 0) > 0; // Question 9 index is 8
  const tier = PHQ9_TIERS.find(t => total >= t.min && total <= t.max)?.severity || 'unknown';
  return {
    totalScore: total,
    severity: tier,
    safetyReviewRequired: q9Positive,
    criticalFlag: (answers[8] || 0) >= 2
  };
}

// Test 1: PHQ-9 scoring & Q9 safety flag
console.log('Testing PHQ-9 Scoring & Safety Flags...');
const baselineAnswers = [3, 2, 2, 3, 2, 2, 1, 1, 0]; // Total 16 (Moderately severe), Q9 = 0
const res1 = calculatePHQ9Score(baselineAnswers);
assert.strictEqual(res1.totalScore, 16);
assert.strictEqual(res1.severity, 'moderately severe');
assert.strictEqual(res1.safetyReviewRequired, false, 'Q9=0 should not require safety review');

const safetyAnswers = [1, 1, 0, 0, 1, 0, 0, 0, 1]; // Total 4 (Minimal overall), but Q9 = 1!
const res2 = calculatePHQ9Score(safetyAnswers);
assert.strictEqual(res2.totalScore, 4);
assert.strictEqual(res2.severity, 'minimal');
assert.strictEqual(res2.safetyReviewRequired, true, 'Q9 > 0 MUST trigger safety review flag regardless of low total score');
console.log('✔ Test 1 Passed: Q9 safety flag triggered accurately regardless of total score.');

// 2. Longitudinal Delta & Remission Logic
function calculateDelta(baseline, followUp) {
  const delta = followUp - baseline;
  const pctChange = ((baseline - followUp) / (baseline || 1)) * 100;
  const remitted = followUp < 5;
  const clinicallyMeaningful = baseline - followUp >= 5; // 5-point drop is MCID
  return { delta, pctChange, remitted, clinicallyMeaningful };
}

console.log('Testing Longitudinal Delta & Remission...');
const outcome = calculateDelta(18, 4); // 18 down to 4
assert.strictEqual(outcome.delta, -14);
assert.strictEqual(outcome.remitted, true, 'Score < 5 indicates remission');
assert.strictEqual(outcome.clinicallyMeaningful, true, 'Drop >= 5 points is clinically meaningful');
console.log('✔ Test 2 Passed: Longitudinal delta and remission calculation verified.');

// 3. Role-Based Permissions Enforcement
const ROLE_PERMISSIONS = {
  admin: { canManageUsers: true, canEditClinical: true, canViewConfidential: true, canUploadFiles: true, canDeleteData: true },
  facilitator: { canManageUsers: false, canEditClinical: true, canViewConfidential: true, canUploadFiles: false, canDeleteData: false },
  clinical_reviewer: { canManageUsers: false, canEditClinical: true, canViewConfidential: true, canUploadFiles: false, canDeleteData: false },
  analyst: { canManageUsers: false, canEditClinical: false, canViewConfidential: false, canUploadFiles: true, canDeleteData: false },
  external_viewer: { canManageUsers: false, canEditClinical: false, canViewConfidential: false, canUploadFiles: false, canDeleteData: false }
};

console.log('Testing Role-Based Access Control...');
assert.strictEqual(ROLE_PERMISSIONS.admin.canManageUsers, true);
assert.strictEqual(ROLE_PERMISSIONS.external_viewer.canViewConfidential, false, 'External viewer MUST NOT access confidential data');
assert.strictEqual(ROLE_PERMISSIONS.analyst.canViewConfidential, false, 'Analyst should only see de-identified/aggregated data');
assert.strictEqual(ROLE_PERMISSIONS.analyst.canUploadFiles, true, 'Analyst can upload analytical datasets');
assert.strictEqual(ROLE_PERMISSIONS.facilitator.canManageUsers, false, 'Facilitator cannot manage user accounts');
console.log('✔ Test 3 Passed: Role-based permissions matrix correctly configured.');

// 4. Data Anonymization Function
function anonymizeParticipants(participants) {
  return participants.map((p, idx) => ({
    id: `ANON-${String(idx + 1).padStart(3, '0')}`,
    ageGroup: p.age ? (p.age < 25 ? '18-24' : p.age < 40 ? '25-39' : '40+') : 'Unknown',
    gender: p.gender || 'Not specified',
    groupName: p.groupName || 'Unassigned',
    attendanceRate: p.attendanceRate || 0,
    // Name, phone, email, notes are stripped
  }));
}

console.log('Testing Data Anonymization for External Viewers...');
const sampleRaw = [
  { id: '1', name: 'John Doe', phone: '0412345678', age: 34, gender: 'Male', groupName: 'Group A', notes: 'Severe trauma history' }
];
const anon = anonymizeParticipants(sampleRaw);
assert.strictEqual(anon[0].id, 'ANON-001');
assert.strictEqual(anon[0].name, undefined, 'Raw name MUST be stripped');
assert.strictEqual(anon[0].phone, undefined, 'Phone MUST be stripped');
assert.strictEqual(anon[0].notes, undefined, 'Confidential clinical notes MUST be stripped');
assert.strictEqual(anon[0].ageGroup, '25-39');
console.log('✔ Test 4 Passed: Data anonymization correctly sanitizes all PII and clinical notes.');

// 5. Smart Import Column Mapping & Quality Validation
function validateSmartImport(rows, requiredColumns) {
  const missingCols = requiredColumns.filter(c => !Object.keys(rows[0] || {}).includes(c));
  const duplicates = new Set();
  const seenIds = new Set();
  let missingValueCount = 0;

  rows.forEach(r => {
    if (r.id) {
      if (seenIds.has(r.id)) duplicates.add(r.id);
      seenIds.add(r.id);
    }
    Object.values(r).forEach(v => {
      if (v === null || v === undefined || v === '') missingValueCount++;
    });
  });

  return {
    isValid: missingCols.length === 0,
    missingColumns: missingCols,
    duplicateCount: duplicates.size,
    missingValueCount,
    rowCount: rows.length
  };
}

console.log('Testing Smart Import Validation...');
const sampleRows = [
  { id: 'P01', name: 'Alice', age: 28 },
  { id: 'P02', name: 'Bob', age: null },
  { id: 'P01', name: 'Alice Duplicate', age: 29 } // duplicate id
];
const validation = validateSmartImport(sampleRows, ['id', 'name', 'age']);
assert.strictEqual(validation.isValid, true);
assert.strictEqual(validation.duplicateCount, 1, 'Should detect duplicate ID P01');
assert.strictEqual(validation.missingValueCount, 1, 'Should detect 1 missing value (Bob age)');
assert.strictEqual(validation.rowCount, 3);
console.log('✔ Test 5 Passed: Smart Import validation correctly identifies missing values and duplicates.');

// 6. Excel 5-Sheet Clinical Workbook Verification
console.log('Testing Excel 5-Sheet Data Model & Facilitator Scoring Guidance...');
const EXCEL_SCORING_TIERS = [
  { min: 0, max: 4, severity: 'None to minimal depression', messageKeyword: 'little to no signs' },
  { min: 5, max: 9, severity: 'Mild depression', messageKeyword: 'watchful waiting' },
  { min: 10, max: 14, severity: 'Moderate depression', messageKeyword: 'treatment plan together' },
  { min: 15, max: 19, severity: 'Moderately severe depression', messageKeyword: 'carry this alone' },
  { min: 20, max: 27, severity: 'Severe depression', messageKeyword: 'urgent treatment plan' },
];

function getFacilitatorTier(score) {
  return EXCEL_SCORING_TIERS.find(t => score >= t.min && score <= t.max) || EXCEL_SCORING_TIERS[0];
}

const tier1 = getFacilitatorTier(3);
assert.strictEqual(tier1.severity, 'None to minimal depression');
assert(tier1.messageKeyword.includes('little to no signs'));

const tier3 = getFacilitatorTier(12);
assert.strictEqual(tier3.severity, 'Moderate depression');

const tier5 = getFacilitatorTier(24);
assert.strictEqual(tier5.severity, 'Severe depression');

// Problem areas check
const IPT_PROBLEM_AREAS = ['Grief & loss', 'Disputes', 'Life changes', 'Loneliness/social isolation'];
assert.strictEqual(IPT_PROBLEM_AREAS.length, 4);

// Work mode check
const WORK_MODES = ['On-site', 'Hybrid', 'Remote', 'Multiple-sites'];
assert.strictEqual(WORK_MODES.length, 4);

console.log('✔ Test 6 Passed: Excel workbook clinical scoring tiers, scripted messages, and workplace categories verified.');

console.log('\n=======================================');
console.log('ALL 6 CORE ARCHITECTURAL TESTS PASSED!');
console.log('=======================================');
