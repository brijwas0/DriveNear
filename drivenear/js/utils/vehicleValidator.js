/* DriveNear — js/utils/vehicleValidator.js
   Indian Vehicle Registration Number & Brand Catalog Helpers
*/

const INDIAN_STATES_RTO = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CG': 'Chhattisgarh',
  'CH': 'Chandigarh',
  'DD': 'Daman and Diu',
  'DN': 'Dadra and Nagar Haveli',
  'DL': 'Delhi NCR',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HR': 'Haryana',
  'HP': 'Himachal Pradesh',
  'JK': 'Jammu and Kashmir',
  'JH': 'Jharkhand',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Ladakh',
  'LD': 'Lakshadweep',
  'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra',
  'MN': 'Manipur',
  'ML': 'Meghalaya',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OD': 'Odisha',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'PY': 'Puducherry',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TS': 'Telangana',
  'TR': 'Tripura',
  'UP': 'Uttar Pradesh',
  'UK': 'Uttarakhand',
  'UA': 'Uttarakhand',
  'WB': 'West Bengal'
};

const POPULAR_CAR_BRANDS = {
  'Hyundai': ['Creta', 'Venue', 'i20', 'Verna', 'Exter', 'Alcazar', 'Tucson', 'Aura'],
  'Tata': ['Nexon', 'Punch', 'Harrier', 'Safari', 'Altroz', 'Tiago', 'Punch EV', 'Nexon EV', 'Curvv'],
  'Mahindra': ['XUV700', 'Thar', 'Scorpio-N', 'Scorpio Classic', 'XUV300', 'XUV3XO', 'Bolero', 'XUV400 EV'],
  'Maruti Suzuki': ['Swift', 'Brezza', 'Baleno', 'Grand Vitara', 'Ertiga', 'Fronx', 'Dzire', 'Jimny', 'XL6'],
  'Toyota': ['Innova Crysta', 'Fortuner', 'Hyryder', 'Innova Hycross', 'Glanza', 'Hilux', 'Camry'],
  'Kia': ['Seltos', 'Sonet', 'Carens', 'EV6', 'Carnival'],
  'Honda': ['City', 'Elevate', 'Amaze'],
  'MG': ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster'],
  'Volkswagen': ['Virtus', 'Taigun', 'Tiguan'],
  'Skoda': ['Slavia', 'Kushaq', 'Kodiaq', 'Superb'],
  'BMW': ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'M340i'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLA', 'GLC', 'GLE'],
  'Audi': ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
  'Renault': ['Kwid', 'Triber', 'Kiger'],
  'Nissan': ['Magnite']
};

/**
 * Validates Indian Vehicle Registration Number.
 * Supports:
 *  1. Standard: e.g. UP 80 AB 1234, DL 01 A 5678, MH 12 CD 9999, HR 26 DQ 5555
 *  2. Bharat Series: e.g. 22 BH 1234 AA
 */
function validateVehicleRegNumber(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, formatted: '', message: 'Registration number is required.' };
  }

  // Clean whitespace and hyphens, convert to uppercase
  const cleaned = rawInput.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (cleaned.length < 8 || cleaned.length > 11) {
    return {
      isValid: false,
      formatted: rawInput.trim().toUpperCase(),
      message: 'Invalid length. Expected format like UP 80 AB 1234 or 22 BH 1234 AA.'
    };
  }

  // Check Bharat (BH) series format: YY BH 0000 XX
  const bhMatch = cleaned.match(/^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    const [, year, num, series] = bhMatch;
    const formatted = `${year} BH ${num} ${series}`;
    return {
      isValid: true,
      formatted,
      type: 'BH Series (All India)',
      stateCode: 'BH',
      stateName: 'Bharat Series (All-India Central Registration)',
      rtoCode: year,
      series,
      number: num,
      message: `Valid Bharat Series (Year: 20${year}, No: ${num}, Series: ${series})`
    };
  }

  // Check Standard Indian format: State (2 letters) + RTO (1-2 digits) + Series (1-3 letters) + Number (4 digits)
  const stdMatch = cleaned.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
  if (stdMatch) {
    const [, st, rto, series, num] = stdMatch;
    const stateName = INDIAN_STATES_RTO[st];

    if (!stateName) {
      return {
        isValid: false,
        formatted: `${st} ${rto} ${series} ${num}`,
        message: `Unknown state code "${st}". Please enter a valid Indian state registration.`
      };
    }

    const formatted = `${st} ${rto.padStart(2, '0')} ${series} ${num}`;
    return {
      isValid: true,
      formatted,
      type: 'Standard RTO',
      stateCode: st,
      stateName,
      rtoCode: rto.padStart(2, '0'),
      series,
      number: num,
      message: `Valid: Registered in ${stateName} (RTO ${rto.padStart(2, '0')}, Series ${series}, No ${num})`
    };
  }

  // Check Standard Indian format without series letters (older vehicles / vintage): State + RTO + Number
  const oldMatch = cleaned.match(/^([A-Z]{2})([0-9]{1,2})([0-9]{4})$/);
  if (oldMatch) {
    const [, st, rto, num] = oldMatch;
    const stateName = INDIAN_STATES_RTO[st];
    if (stateName) {
      const formatted = `${st} ${rto.padStart(2, '0')} ${num}`;
      return {
        isValid: true,
        formatted,
        type: 'Standard RTO (Vintage/Direct)',
        stateCode: st,
        stateName,
        rtoCode: rto.padStart(2, '0'),
        series: '',
        number: num,
        message: `Valid: Registered in ${stateName} (RTO ${rto.padStart(2, '0')}, No ${num})`
      };
    }
  }

  return {
    isValid: false,
    formatted: rawInput.trim().toUpperCase(),
    message: 'Invalid registration number format. Valid format example: UP 80 AB 1234 or DL 01 CZ 4321.'
  };
}

/**
 * Render real-time validation badge for UI inputs
 */
function renderRegValidationFeedback(inputVal) {
  const v = validateVehicleRegNumber(inputVal);
  if (!inputVal || !inputVal.trim()) {
    return `<p class="text-xs text-muted mt-1.5 flex items-center gap-1.5">
      <span>ℹ️</span> Enter Indian registration number (e.g. <strong>UP 80 AB 1234</strong> or <strong>22 BH 1234 AA</strong>)
    </p>`;
  }
  if (v.isValid) {
    return `<div class="mt-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
      <span class="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
      <span>${v.message}</span>
    </div>`;
  }
  return `<div class="mt-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
    <span class="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">✕</span>
    <span>${v.message}</span>
  </div>`;
}
