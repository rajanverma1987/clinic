/**
 * English/international name → Spanish equivalent for patient display when locale=es and no stored Spanish name.
 * Pure in-memory dictionary; no external API or PHI leaves the server.
 * Names not in the dictionary are returned unchanged (acceptable in Spanish).
 */

/** Common first/last name → Spanish equivalent (lowercase keys for lookup) */
const NAME_TO_SPANISH = {
  // Male first names
  john: 'Juan',
  george: 'Jorge',
  joseph: 'José',
  jose: 'José',
  william: 'Guillermo',
  robert: 'Roberto',
  roberto: 'Roberto',
  edward: 'Eduardo',
  eduardo: 'Eduardo',
  james: 'Jaime',
  eric: 'Enrique',
  enrique: 'Enrique',
  charles: 'Carlos',
  carlos: 'Carlos',
  peter: 'Pedro',
  pedro: 'Pedro',
  paul: 'Pablo',
  pablo: 'Pablo',
  michael: 'Miguel',
  miguel: 'Miguel',
  david: 'David',
  daniel: 'Daniel',
  andrew: 'Andrés',
  andres: 'Andrés',
  anthony: 'Antonio',
  antonio: 'Antonio',
  mark: 'Marcos',
  marcos: 'Marcos',
  thomas: 'Tomás',
  tomas: 'Tomás',
  christopher: 'Cristóbal',
  matthew: 'Mateo',
  mateo: 'Mateo',
  stephen: 'Esteban',
  steven: 'Esteban',
  richard: 'Ricardo',
  ricardo: 'Ricardo',
  raja: 'Rey',
  raj: 'Rey',
  // Female first names
  mary: 'María',
  maria: 'María',
  marie: 'María',
  jane: 'Juana',
  juana: 'Juana',
  juanita: 'Juanita',
  elizabeth: 'Isabel',
  isabel: 'Isabel',
  isabella: 'Isabela',
  beatrice: 'Beatriz',
  beatriz: 'Beatriz',
  alexandra: 'Alejandra',
  alejandra: 'Alejandra',
  patricia: 'Patricia',
  priscilla: 'Priscila',
  priscila: 'Priscila',
  jasmine: 'Jazmín',
  anne: 'Ana',
  anna: 'Ana',
  ana: 'Ana',
  catherine: 'Catalina',
  katherine: 'Catalina',
  kate: 'Catalina',
  margaret: 'Margarita',
  margarita: 'Margarita',
  susan: 'Susana',
  susana: 'Susana',
  helen: 'Elena',
  elena: 'Elena',
  // Last names: dictionary only for names that have a Spanish spelling variant; others stay as-is
  garcia: 'García',
  martinez: 'Martínez',
  rodriguez: 'Rodríguez',
  lopez: 'López',
  gonzalez: 'González',
};

/**
 * Translate a single name (first or last) to Spanish when a known equivalent exists.
 * Preserves original capitalization pattern when possible; otherwise capitalizes first letter.
 *
 * @param {string} name - Single name (e.g. "John" or "Sharma")
 * @returns {string} Spanish equivalent if in dictionary, otherwise original
 */
export function translateToSpanish(name) {
  if (name == null || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  const translated = NAME_TO_SPANISH[lower];
  if (translated) {
    return translated;
  }
  return trimmed;
}
