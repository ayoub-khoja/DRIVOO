/**
 * Static catalog of popular car makes / models for Tunisian rental fleets.
 * Used by agency Autocomplete (freeSolo) — same UX pattern as geo address fields.
 */

export type CarMakeCatalog = Record<string, string[]>

/** Makes sorted A–Z; models roughly by popularity / common rental stock. */
export const CAR_MAKES_MODELS: CarMakeCatalog = {
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  BMW: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'iX'],
  BYD: ['Atto 3', 'Dolphin', 'Seal', 'Han'],
  Chevrolet: ['Aveo', 'Captiva', 'Spark', 'Tracker', 'Trax'],
  'Citroën': ['C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C4 X', 'C5 Aircross', 'Berlingo', 'Jumpy', 'Jumper'],
  Cupra: ['Formentor', 'Leon', 'Ateca', 'Born'],
  Dacia: ['Sandero', 'Sandero Stepway', 'Logan', 'Duster', 'Jogger', 'Spring', 'Lodgy', 'Dokker'],
  DS: ['DS 3', 'DS 4', 'DS 7'],
  Fiat: ['500', '500X', 'Panda', 'Tipo', 'Doblo', 'Fiorino', 'Ducato'],
  Ford: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'EcoSport', 'Mustang', 'Ranger', 'Transit', 'Tourneo'],
  Geely: ['Coolray', 'Emgrand', 'Okavango'],
  Honda: ['Civic', 'HR-V', 'CR-V', 'Jazz', 'Accord'],
  Hyundai: ['i10', 'i20', 'i30', 'Accent', 'Elantra', 'Tucson', 'Creta', 'Kona', 'Santa Fe', 'Bayon', 'Ioniq 5'],
  Jeep: ['Renegade', 'Compass', 'Cherokee', 'Wrangler', 'Grand Cherokee'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Seltos', 'Sorento', 'Stonic', 'Niro', 'EV6', 'Carnival'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover'],
  Lexus: ['UX', 'NX', 'RX', 'ES'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-30', 'CX-60'],
  Mercedes: ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'GLA', 'GLB', 'GLC', 'GLE', 'Vito', 'Sprinter'],
  MG: ['MG3', 'MG4', 'MG5', 'ZS', 'HS', 'Marvel R'],
  Mini: ['Cooper', 'Countryman', 'Clubman'],
  Mitsubishi: ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander', 'L200', 'Pajero'],
  Nissan: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Note', 'Navara', 'Leaf'],
  Opel: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Vivaro'],
  Peugeot: ['208', '2008', '308', '3008', '408', '5008', 'Partner', 'Rifter', 'Expert', 'Boxer'],
  Porsche: ['Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Renault: ['Clio', 'Captur', 'Megane', 'Austral', 'Kadjar', 'Arkana', 'Scenic', 'Espace', 'Kangoo', 'Trafic', 'Master', 'Twingo'],
  Seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  Skoda: ['Fabia', 'Scala', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq', 'Superb', 'Enyaq'],
  Suzuki: ['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Baleno'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Toyota: ['Yaris', 'Yaris Cross', 'Corolla', 'Corolla Cross', 'C-HR', 'RAV4', 'Hilux', 'Land Cruiser', 'Camry', 'Aygo', 'Proace'],
  Volkswagen: ['Polo', 'Golf', 'T-Roc', 'T-Cross', 'Tiguan', 'Touareg', 'Passat', 'ID.3', 'ID.4', 'Caddy', 'Transporter'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60', 'V60'],
}

export const CAR_MAKES = Object.keys(CAR_MAKES_MODELS).sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' }),
)

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

/** Resolve catalog make key from free text (accents / case insensitive). */
export const resolveMakeKey = (brand: string): string | null => {
  const needle = normalize(brand)
  if (!needle) {
    return null
  }
  return CAR_MAKES.find((make) => normalize(make) === needle) ?? null
}

/** Models for a make; empty if brand is unknown (freeSolo still allowed). */
export const getModelsForMake = (brand: string): string[] => {
  const key = resolveMakeKey(brand)
  if (!key) {
    return []
  }
  return CAR_MAKES_MODELS[key] ?? []
}
