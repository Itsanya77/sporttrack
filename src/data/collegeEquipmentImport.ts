import { Equipment } from '../types';

export interface ImportEquipmentSeedRow {
  name: string;
  quantity: number;
  sport: string;
  remarks?: string;
}

export interface PreparedImportEquipmentRow {
  index: number;
  name: string;
  sport: string;
  quantity: number;
  equipment_code: string;
  remarks: string;
  equipment: Equipment;
}

const SPORT_CODE_PREFIX_MAP: Record<string, string> = {
  Football: 'FB',
  Handball: 'HB',
  Basketball: 'BB',
  Baseball: 'BASE',
  Softball: 'SB',
  Cricket: 'CR',
  Badminton: 'BAD',
  Lagori: 'LAG',
  'Kho-Kho': 'KHO',
  Athletics: 'ATH',
  'Table Tennis': 'TT',
  Training: 'TRN',
  'Tug of War': 'TOW',
  Yoga: 'YOG',
  Hockey: 'HOC',
  Fitness: 'FIT',
  'Flying Disc': 'FD',
  Carrom: 'CAR',
  Powerlifting: 'PL',
  Netball: 'NB',
};

export const COLLEGE_REAL_EQUIPMENT_ROWS: ImportEquipmentSeedRow[] = [
  { name: 'Football Gloves - Nivia', quantity: 3, sport: 'Football' },
  { name: 'Football Shining Star', quantity: 6, sport: 'Football' },
  { name: 'Handball Men', quantity: 4, sport: 'Handball' },
  { name: 'Handball Women', quantity: 6, sport: 'Handball' },
  { name: 'Basketball No. 7', quantity: 6, sport: 'Basketball' },
  { name: 'Basketball No. 6', quantity: 6, sport: 'Basketball' },
  { name: 'Baseball Super Plus', quantity: 6, sport: 'Baseball' },
  { name: 'Softball 510 C', quantity: 6, sport: 'Softball' },
  { name: 'Cricket Match Ball', quantity: 6, sport: 'Cricket' },
  { name: 'Cricket Practice Ball', quantity: 12, sport: 'Cricket' },
  { name: 'Cricket Tennis Bat', quantity: 6, sport: 'Cricket' },
  { name: 'Stumps', quantity: 4, sport: 'Cricket' },
  { name: 'Cricket Batting Pad', quantity: 4, sport: 'Cricket' },
  { name: 'Cricket Tennis Ball Garsu', quantity: 24, sport: 'Cricket' },
  { name: 'Cricket Abdominal Guard', quantity: 6, sport: 'Cricket' },
  { name: 'Cricket HK Pad', quantity: 2, sport: 'Cricket' },
  { name: 'Cricket Arm Pad', quantity: 2, sport: 'Cricket' },
  { name: 'Badminton Shuttle M 350', quantity: 6, sport: 'Badminton' },
  { name: 'Lagori', quantity: 1, sport: 'Lagori' },
  { name: 'Lagori Ball Sixit', quantity: 6, sport: 'Lagori' },
  { name: 'Kho-Kho Pole', quantity: 1, sport: 'Kho-Kho' },
  { name: 'Stop Watch DG 565', quantity: 3, sport: 'Athletics' },
  { name: 'Hammer Throw 7.26 Kg', quantity: 1, sport: 'Athletics' },
  { name: 'Relay Button', quantity: 2, sport: 'Athletics' },
  { name: 'Shot Put 4 Kg / 7.26 Kg', quantity: 2, sport: 'Athletics' },
  { name: 'T.T. Racket GKI Euro', quantity: 12, sport: 'Table Tennis' },
  { name: 'T.T. Net', quantity: 2, sport: 'Table Tennis' },
  { name: 'Cone 15"', quantity: 12, sport: 'Training' },
  { name: 'Tug of War Rope 25 Mtr', quantity: 1, sport: 'Tug of War' },
  { name: 'Softball Slugger', quantity: 2, sport: 'Softball' },
  { name: 'Catcher Helmet', quantity: 2, sport: 'Softball' },
  { name: 'Catcher Gloves', quantity: 2, sport: 'Softball' },
  { name: 'Cricket Helmet', quantity: 4, sport: 'Cricket' },
  { name: 'Badminton Racket Yonex-303', quantity: 12, sport: 'Badminton' },
  { name: 'Meter Tape 100 Mtr', quantity: 1, sport: 'Athletics' },
  { name: 'Cone 9"', quantity: 12, sport: 'Training' },
  { name: 'Dish Cone', quantity: 36, sport: 'Training' },
  { name: 'Cricket Bat SG Sierra Plus', quantity: 6, sport: 'Cricket' },
  { name: 'Cricket Batting Gloves', quantity: 4, sport: 'Cricket' },
  { name: 'Yoga Mat Konex 6mm', quantity: 60, sport: 'Yoga' },
  { name: 'Hockey Ball', quantity: 6, sport: 'Hockey' },
  { name: 'Handball Men', quantity: 2, sport: 'Handball' },
  { name: 'Hoola Hoops Ring 24"', quantity: 16, sport: 'Fitness' },
  { name: 'Stopwatch DG 365', quantity: 2, sport: 'Athletics' },
  { name: 'T.T. Ball Konex 3 Stars', quantity: 50, sport: 'Table Tennis' },
  { name: 'Vixen Flying Disc', quantity: 2, sport: 'Flying Disc' },
  { name: 'Carrom Powder', quantity: 12, sport: 'Carrom' },
  { name: 'Softball Helmet', quantity: 2, sport: 'Softball' },
  { name: 'Babolat Feather Shuttle Box', quantity: 2, sport: 'Badminton' },
  { name: 'Badminton Movable Pole with Net', quantity: 2, sport: 'Badminton', remarks: 'pair' },
  { name: 'Dr. Trust Fat Analyzer', quantity: 1, sport: 'Fitness' },
  { name: 'Fitto Weight Machine', quantity: 1, sport: 'Fitness' },
  { name: 'Hanging Stadiometer', quantity: 2, sport: 'Fitness' },
  { name: 'ATE Powerlifting Set - 290 Kg', quantity: 1, sport: 'Powerlifting' },
  { name: 'ATE Deadlift Platform', quantity: 1, sport: 'Powerlifting' },
  { name: 'Olympic Flat Bench', quantity: 1, sport: 'Powerlifting' },
  { name: 'Squat Rack Powerlifting', quantity: 1, sport: 'Powerlifting', remarks: 'pair' },
  { name: 'Powerlifting Belt', quantity: 1, sport: 'Powerlifting' },
  { name: 'Powerlifting Powder', quantity: 5, sport: 'Powerlifting' },
  { name: 'Netball', quantity: 2, sport: 'Netball' },
];

export const EXPECTED_IMPORT_RECORDS = 60;
export const EXPECTED_IMPORT_UNITS = 411;

const getSportPrefix = (sportName: string): string => {
  if (SPORT_CODE_PREFIX_MAP[sportName]) {
    return SPORT_CODE_PREFIX_MAP[sportName];
  }
  const letters = sportName.replace(/[^A-Za-z]/g, '').toUpperCase();
  return letters.slice(0, 3) || 'EQ';
};

const generateFreshEquipmentDocId = (
  code: string,
  index: number,
  runToken: string,
  excludedIds: Set<string>
): string => {
  const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '_');
  let suffix = '';
  let candidate = `eq_${runToken}_${String(index + 1).padStart(2, '0')}_${cleanCode}`;
  let attempt = 0;
  while (excludedIds.has(candidate)) {
    attempt += 1;
    suffix = `_${Math.random().toString(36).slice(2, 6)}_${attempt}`;
    candidate = `eq_${runToken}_${String(index + 1).padStart(2, '0')}_${cleanCode}${suffix}`;
  }
  excludedIds.add(candidate);
  return candidate;
};

export const buildImportEquipmentRows = (existingDocIds?: Iterable<string>): {
  rows: PreparedImportEquipmentRow[];
  validationErrors: string[];
  totalRecords: number;
  totalUnits: number;
} => {
  const prefixCounters = new Map<string, number>();
  const usedCodes = new Set<string>();
  const excludedIds = new Set<string>(existingDocIds || []);
  const validationErrors: string[] = [];
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];
  const randomNonce =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  const runToken = `${Date.now().toString(36)}_${randomNonce}`;

  const rows: PreparedImportEquipmentRow[] = COLLEGE_REAL_EQUIPMENT_ROWS.map((row, idx) => {
    const cleanName = row.name.trim();
    const cleanSport = row.sport.trim();
    const qty = Number(row.quantity);
    const prefix = getSportPrefix(cleanSport);

    let nextNum = (prefixCounters.get(prefix) || 0) + 1;
    let code = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    while (usedCodes.has(code)) {
      nextNum++;
      code = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    }
    prefixCounters.set(prefix, nextNum);
    usedCodes.add(code);

    if (!cleanName) {
      validationErrors.push(`Row ${idx + 1}: Equipment name is empty.`);
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      validationErrors.push(`Row ${idx + 1} (${cleanName || 'Unnamed'}): Quantity "${row.quantity}" is not a positive integer.`);
    }
    if (!cleanSport) {
      validationErrors.push(`Row ${idx + 1} (${cleanName || 'Unnamed'}): Sport is empty.`);
    }

    const newDocId = generateFreshEquipmentDocId(code, idx, runToken, excludedIds);

    const equipment: Equipment = {
      id: newDocId,
      equipment_code: code,
      name: cleanName,
      sport_id: cleanSport,
      quantity: qty,
      available_quantity: qty,
      issued_quantity: 0,
      condition: 'GOOD',
      status: 'AVAILABLE',
      purchase_date: todayDate,
      remarks: row.remarks ? row.remarks.trim() : '',
      created_at: nowIso,
      active: true,
    };

    return {
      index: idx + 1,
      name: cleanName,
      sport: cleanSport,
      quantity: qty,
      equipment_code: code,
      remarks: equipment.remarks,
      equipment,
    };
  });

  if (usedCodes.size !== rows.length) {
    validationErrors.push('Duplicate equipment codes were detected during code generation.');
  }

  const totalRecords = rows.length;
  const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

  return {
    rows,
    validationErrors,
    totalRecords,
    totalUnits,
  };
};
