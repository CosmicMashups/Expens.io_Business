export const EXPENSE_CATEGORY_CODES = [
  'material_cost', 'coil_breakdown', 'labor_cost', 'company_outing',
  'mandatories', 'equipment_power_tools', 'compensation_1601c', 'diesel_tollgate',
  'equipment_maintenance', 'subcon', 'house_rentals', 'surety_commission',
  'five_percent_com', 'twelve_percent_vat', 'uniforms_ppe', 'iso_certification', 'others',
] as const

export const VAT_RATE_OPTIONS = [
  { label: '12% (Standard)', value: 0.12 },
  { label: '3% (Percentage Tax)', value: 0.03 },
  { label: '0% (Zero-Rated)', value: 0 },
  { label: '5% (Special)', value: 0.05 },
]

export const CURRENCY_OPTIONS = [
  { label: 'PHP', value: 'PHP' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'JPY', value: 'JPY' },
  { label: 'SGD', value: 'SGD' },
  { label: 'CNY', value: 'CNY' },
  { label: 'AUD', value: 'AUD' },
]

export const PROJECT_STATUS_OPTIONS = [
  { label: 'Quotation', value: 'quotation' },
  { label: 'Awarded', value: 'awarded' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
]

export const PMR_EXCEL_COLUMNS = [
  { key: 'report_id', header: 'ReportID' },
  { key: 'report_description', header: 'ReportDescription' },
  { key: 'client', header: 'Client' },
  { key: 'date_start', header: 'DateStart' },
  { key: 'date_finish', header: 'DateFinish' },
  { key: 'accomplishment', header: 'Accomplishment' },
  { key: 'remarks', header: 'Remarks' },
  { key: 'contracted_amount', header: 'ContractedAmount' },
  { key: 'tax_amount', header: 'TaxAmount' },
  { key: 'amount_collected', header: 'AmountCollected' },
  { key: 'balance_to_be_collected', header: 'BalanceToBeCollected' },
  { key: 'material_cost_rental_scaffolds_tools_equipments', header: 'MaterialCostRentalScaffoldsToolsEquipments' },
  { key: 'coil_breakdown', header: 'CoilBreakdown' },
  { key: 'labor_cost', header: 'LaborCost' },
  { key: 'company_outing_13th_month', header: 'CompanyOuting13thMonth' },
  { key: 'mandatories', header: 'Mandatories' },
  { key: 'equipment_power_tools', header: 'EquipmentPowerTools' },
  { key: 'compensation_1601c', header: 'Compensation1601C' },
  { key: 'diesel_tollgate_machine_vehicles_registration', header: 'DieselTollgateMachineVehiclesRegistration' },
  { key: 'equipment_vehicle_tools_maintenance_calibration', header: 'EquipmentVehicleToolsMaintenanceCalibration' },
  { key: 'subcon_project_payment_supplier', header: 'SubconProjectPaymentSupplier' },
  { key: 'house_rentals_utilities_maintenance', header: 'HouseRentalsUtilitiesMaintenance' },
  { key: 'surity_bond_commission_others', header: 'SurityBondCommissionOthers' },
  { key: 'five_percent_com', header: 'FivePercentCom' },
  { key: 'twelve_percent_vat', header: 'TwelvePercentVAT' },
  { key: 'uniforms_ppe_medical_medicines_insurance_ids', header: 'UniformsPPEMedicalMedicinesInsuranceIDs' },
  { key: 'iso_certification', header: 'ISOCertification' },
  { key: 'others_meal_pf_load_drawings_seminars_permits_const_fee', header: 'OthersMealPFLoadDrawingsSeminarsPermitsConstFee' },
  { key: 'total_expenses', header: 'TotalExpenses' },
  { key: 'profit', header: 'Profit' },
] as const

export const PMR_SAMPLE_ROW2_HEADERS = [
  null,
  'PROJECT NAME',
  'PROJECT /CLIENT',
  'DATE START',
  'DATE FINISH',
  'ACCOMPLISHMENT',
  'REMARKS',
  'Contracted Amount',
  'Tax Amount',
  'Amount Collected',
  'Balance to be Collected',
  null,
  'Material Cost / RENTAL of Scaffolds ETC../ Tools & Equips',
  'Coil Breakdown',
  'Labor Cost ',
  'Company Outing / 13Th Month / Christmas Expenses',
  'Mandatories',
  'EQUIPMENT / HEAVY EQUIPMENTS / POWER TOOLS',
  '1601 C (Compensation)',
  'Diesel/   Maintenance/ Tollgate / MACHINE / NEW VEHICLES/ Vehicle Registration',
  null,
  'SUBCON PROJ. PAYMENT /supplier',
  'HOUSE RENTALS / Utilities / Maintenance',
  'Surity Bond / Commission  ',
  '5% Com',
  '12% VAT',
  "UNIFORMS/ PPE's / MEDICAL Expenses/ medicines",
  null,
  'OTHERS (Meal, PF, drawings , Seminars, Permits etc. & Const Fee)',
  'TOTAL EXPENSES',
  'Profit',
] as const

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
