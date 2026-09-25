// Public, source-backed product facts only. Recheck lender pages before a production release.
const checked = '2026-09-25';

export const agriLoans = [
  {
    id: 'kcc-scheme', bank: 'Participating bank', name: 'Kisan Credit Card (KCC)', category: 'crop_working_capital',
    purposes: ['crop_cultivation', 'working_capital', 'dairy_livestock', 'fisheries'],
    farmerTypes: ['owner_cultivator', 'tenant_farmer', 'sharecropper', 'farmer_group'],
    minAmount: null, maxAmount: null, landRequirement: null, ageRequirement: null,
    eligibilityRules: ['purpose', 'farmer_type', 'lender_assessment'],
    documents: ['application', 'identity', 'address', 'photograph', 'cultivation_proof'],
    features: ['seasonal_credit', 'need_based_limit'], applicationUrl: null,
    officialInformationUrl: 'https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=11325',
    sourceName: 'Reserve Bank of India', lastVerifiedAt: checked, isGovernmentScheme: true, isActive: true
  },
  {
    id: 'sbi-kcc', bank: 'State Bank of India', name: 'SBI Kisan Credit Card', category: 'crop_working_capital',
    purposes: ['crop_cultivation', 'working_capital', 'dairy_livestock', 'fisheries'],
    farmerTypes: ['owner_cultivator', 'tenant_farmer', 'sharecropper', 'farmer_group'],
    minAmount: null, maxAmount: null, landRequirement: null, ageRequirement: null,
    eligibilityRules: ['purpose', 'farmer_type', 'lender_assessment'],
    documents: ['application', 'identity', 'address', 'photograph', 'cultivation_proof'],
    features: ['seasonal_credit', 'need_based_limit'],
    // SBI links a PM-KISAN-specific form, not a verified general online KCC submission.
    applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  },
  {
    id: 'sbi-samriddhi', bank: 'State Bank of India', name: 'SBI Kisan Samriddhi Rin', category: 'progressive_farming',
    purposes: ['crop_cultivation', 'working_capital'],
    farmerTypes: ['owner_cultivator', 'tenant_farmer', 'farmer_group', 'fpo'],
    minAmount: 500000, maxAmount: 500000000, landRequirement: { minAcres: 4, alternativeScientificFarming: true }, ageRequirement: { minYears: 18 },
    eligibilityRules: ['purpose', 'farmer_type', 'amount', 'land_or_scientific', 'age', 'lender_assessment'],
    documents: ['application', 'identity', 'address', 'cultivation_proof', 'cropping_pattern'],
    features: ['end_to_end_farming'], applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/agri-rural/agriculture-banking/kisan-samriddhi-rin',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  },
  {
    id: 'sbi-tractor', bank: 'State Bank of India', name: 'SBI Tractor Loan Scheme', category: 'farm_mechanisation',
    purposes: ['farm_equipment'], equipmentType: 'tractor', farmerTypes: ['owner_cultivator'],
    minAmount: 200000, maxAmount: 2500000, landRequirement: { minAcres: 2 }, ageRequirement: null,
    eligibilityRules: ['purpose', 'equipment_type', 'farmer_type', 'amount', 'land', 'lender_assessment'],
    documents: ['application', 'photograph', 'cultivation_proof', 'equipment_quotation'],
    features: ['tractor_purchase'], applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/farm-mechanization-loan/tractor-loan/new-tractor-loan-scheme',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  },
  {
    id: 'sbi-asset-backed', bank: 'State Bank of India', name: 'SBI Asset Backed Agri Loan', category: 'farm_mechanisation',
    purposes: ['farm_equipment'], farmerTypes: ['owner_cultivator', 'fpo'],
    minAmount: 300001, maxAmount: 5000000, landRequirement: null, ageRequirement: null,
    eligibilityRules: ['purpose', 'farmer_type', 'amount', 'lender_assessment'],
    documents: ['application', 'identity', 'address', 'cultivation_proof', 'equipment_quotation'],
    features: ['farm_mechanisation'], applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/asset-backed-agri-loan',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  },
  {
    id: 'sbi-irrigation', bank: 'State Bank of India', name: 'SBI Composite Minor Irrigation', category: 'irrigation',
    purposes: ['irrigation'], farmerTypes: ['owner_cultivator', 'farmer_group'],
    minAmount: 10000, maxAmount: 4900000, landRequirement: null, ageRequirement: null,
    eligibilityRules: ['purpose', 'farmer_type', 'amount', 'lender_assessment'],
    documents: ['application', 'cultivation_proof'], features: ['irrigation_systems'], applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/agriculture-banking/farm-mechanization-loan/drip-irrigation',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  },
  {
    id: 'sbi-warehouse', bank: 'State Bank of India', name: 'SBI Cold Storage / Warehouse Scheme', category: 'storage_infrastructure',
    purposes: ['storage_warehouse'], farmerTypes: ['owner_cultivator', 'farmer_group', 'fpo'],
    minAmount: 100000, maxAmount: 500000000, landRequirement: null, ageRequirement: null,
    eligibilityRules: ['purpose', 'farmer_type', 'amount', 'lender_assessment'],
    documents: ['application', 'photograph', 'project_report', 'property_documents'], features: ['storage_infrastructure'], applicationUrl: null,
    officialInformationUrl: 'https://sbi.bank.in/web/agri-rural/construction-of-cold-storage/-warehouse-scheme',
    sourceName: 'State Bank of India', lastVerifiedAt: checked, isGovernmentScheme: false, isActive: true
  }
];
