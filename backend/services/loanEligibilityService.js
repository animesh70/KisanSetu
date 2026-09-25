import { agriLoans } from '../data/agriLoans.js';

export const LOAN_PURPOSES = ['crop_cultivation', 'farm_equipment', 'irrigation', 'dairy_livestock', 'fisheries', 'storage_warehouse', 'agri_business', 'working_capital', 'other'];
export const FARMER_TYPES = ['owner_cultivator', 'tenant_farmer', 'sharecropper', 'farmer_group', 'fpo', 'other'];
const PROFILE_FIELDS = new Set(['purpose', 'requestedAmount', 'farmerType', 'landHoldingAcres', 'scientificFarming', 'state', 'district', 'crop', 'activity', 'existingKcc', 'existingLoan', 'age']);

export function validateLoanProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_PROFILE');
  if (Object.keys(input).some((field) => !PROFILE_FIELDS.has(field))) throw new Error('INVALID_PROFILE');
  const profile = { ...input };
  if (profile.purpose !== undefined && !LOAN_PURPOSES.includes(profile.purpose)) throw new Error('INVALID_PURPOSE');
  if (profile.farmerType !== undefined && !FARMER_TYPES.includes(profile.farmerType)) throw new Error('INVALID_FARMER_TYPE');
  if (profile.requestedAmount !== undefined && (!Number.isSafeInteger(profile.requestedAmount) || profile.requestedAmount < 1 || profile.requestedAmount > 1000000000)) throw new Error('INVALID_AMOUNT');
  if (profile.landHoldingAcres !== undefined && (typeof profile.landHoldingAcres !== 'number' || !Number.isFinite(profile.landHoldingAcres) || profile.landHoldingAcres < 0 || profile.landHoldingAcres > 1000000)) throw new Error('INVALID_LAND');
  if (profile.age !== undefined && (!Number.isInteger(profile.age) || profile.age < 0 || profile.age > 120)) throw new Error('INVALID_AGE');
  for (const field of ['scientificFarming', 'existingKcc', 'existingLoan']) if (profile[field] !== undefined && typeof profile[field] !== 'boolean') throw new Error('INVALID_PROFILE');
  for (const field of ['state', 'district', 'crop', 'activity']) if (profile[field] !== undefined && (typeof profile[field] !== 'string' || profile[field].length > 100)) throw new Error('INVALID_PROFILE');
  return profile;
}

export function evaluateLoanEligibility(profile, loan) {
  const matchedCriteria = [];
  const unmetCriteria = [];
  const missingInformation = [];
  if (!profile.purpose) missingInformation.push('purpose');
  else if (!loan.purposes.includes(profile.purpose)) unmetCriteria.push('purpose');
  else matchedCriteria.push('purpose');
  if (loan.equipmentType) {
    if (!profile.activity) missingInformation.push('equipment_type');
    else if (profile.activity !== loan.equipmentType) unmetCriteria.push('equipment_type');
    else matchedCriteria.push('equipment_type');
  }
  if (!profile.farmerType) missingInformation.push('farmer_type');
  else if (!loan.farmerTypes.includes(profile.farmerType)) unmetCriteria.push('farmer_type');
  else matchedCriteria.push('farmer_type');
  if (profile.requestedAmount === undefined) missingInformation.push('requested_amount');
  else if ((loan.minAmount !== null && profile.requestedAmount < loan.minAmount) || (loan.maxAmount !== null && profile.requestedAmount > loan.maxAmount)) unmetCriteria.push('amount');
  else matchedCriteria.push('requested_amount');
  if (loan.landRequirement) {
    const enoughLand = profile.landHoldingAcres !== undefined && profile.landHoldingAcres >= loan.landRequirement.minAcres;
    const alternative = loan.landRequirement.alternativeScientificFarming && profile.scientificFarming === true;
    if (enoughLand || alternative) matchedCriteria.push('land_or_scientific');
    else if (profile.landHoldingAcres === undefined || (loan.landRequirement.alternativeScientificFarming && profile.scientificFarming === undefined)) missingInformation.push('land_or_scientific');
    else unmetCriteria.push('land_or_scientific');
  }
  if (loan.ageRequirement) {
    if (profile.age === undefined) missingInformation.push('age');
    else if (profile.age < loan.ageRequirement.minYears) unmetCriteria.push('age');
    else matchedCriteria.push('age');
  }
  const status = unmetCriteria.length ? 'not_matched' : missingInformation.length ? 'needs_more_information' : loan.id === 'sbi-samriddhi' ? 'possibly_eligible' : 'likely_eligible';
  return { status, matchedCriteria, unmetCriteria, missingInformation, reason: status === 'not_matched' ? 'published_criteria_not_matched' : status === 'needs_more_information' ? 'details_needed' : 'lender_verification_required' };
}

export function recommendLoans(profile, catalog = agriLoans) {
  return catalog.filter((loan) => loan.isActive).map((loan) => ({ loan, ...evaluateLoanEligibility(profile, loan) }))
    .filter((result) => result.status !== 'not_matched')
    .sort((a, b) => {
      const statusRank = { likely_eligible: 0, possibly_eligible: 1, needs_more_information: 2 };
      const purposeRank = (item) => item.loan.category === 'farm_mechanisation' && profile.purpose === 'farm_equipment' ? -1 : item.loan.id === 'sbi-kcc' ? 0 : item.loan.id === 'kcc-scheme' ? 1 : 2;
      return statusRank[a.status] - statusRank[b.status] || purposeRank(a) - purposeRank(b);
    });
}
