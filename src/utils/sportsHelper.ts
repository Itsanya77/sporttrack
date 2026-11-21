import { Equipment, Sport } from '../types';

const LEGACY_SPORT_ID_MAP: Record<string, string> = {
  sport_cricket: 'Cricket',
  sport_football: 'Football',
  sport_volleyball: 'Volleyball',
  sport_basketball: 'Basketball',
  sport_badminton: 'Badminton',
  sport_tennis: 'Tennis',
  sport_tt: 'Table Tennis',
  sport_athletics: 'Athletics',
  sport_fitness: 'Fitness',
  sport_handball: 'Handball',
  sport_baseball: 'Baseball',
  sport_softball: 'Softball',
  sport_lagori: 'Lagori',
  sport_khokho: 'Kho-Kho',
  sport_training: 'Training',
  sport_tugofwar: 'Tug of War',
  sport_yoga: 'Yoga',
  sport_hockey: 'Hockey',
  sport_flyingdisc: 'Flying Disc',
  sport_carrom: 'Carrom',
  sport_netball: 'Netball',
  sport_powerlifting: 'Powerlifting',
};

export interface DerivedSportOption {
  id: string;
  name: string;
}

/**
 * Resolves a stored equipment.sport_id (whether it is a clean sport name like "Cricket"
 * or a legacy ID like "sport_cricket" / custom sport ID) into its canonical display sport name.
 */
export const resolveEquipmentSportName = (sportId?: string, knownSports: Sport[] = []): string => {
  const raw = (sportId || '').trim();
  if (!raw) return 'General';

  if (LEGACY_SPORT_ID_MAP[raw]) {
    return LEGACY_SPORT_ID_MAP[raw];
  }

  const matched = knownSports.find(
    s => s.id === raw || s.name.toLowerCase() === raw.toLowerCase()
  );
  if (matched) {
    return matched.name;
  }

  return raw;
};

/**
 * Builds the canonical sport filter list strictly from active equipment records.
 * Guarantees every sport present in the equipment catalog appears in Student Catalog,
 * Equipment Management, and Request Creation filters without relying on stale hardcoded lists.
 */
export const getCatalogSports = (
  equipment: Equipment[],
  knownSports: Sport[] = [],
  includeInactiveEquipment = false
): DerivedSportOption[] => {
  const seen = new Map<string, DerivedSportOption>();

  equipment.forEach(item => {
    if (!includeInactiveEquipment && !item.active) return;
    const sportName = resolveEquipmentSportName(item.sport_id, knownSports);
    if (!sportName) return;
    const key = sportName.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { id: sportName, name: sportName });
    }
  });

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Checks whether an equipment record belongs to the selected sport filter value.
 */
export const matchesSportFilter = (
  itemSportId: string | undefined,
  selectedSport: string,
  knownSports: Sport[] = []
): boolean => {
  if (!selectedSport || selectedSport === 'ALL') return true;
  const resolvedItemSport = resolveEquipmentSportName(itemSportId, knownSports).toLowerCase();
  const resolvedSelectedSport = resolveEquipmentSportName(selectedSport, knownSports).toLowerCase();
  return resolvedItemSport === resolvedSelectedSport;
};
