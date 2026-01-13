/**
 * Utilidades de validación para formularios de cliente
 */

/**
 * Valida formato de CBU argentino (22 dígitos)
 */
export function validateCBU(cbu: string): { valid: boolean; error?: string } {
  if (!cbu || cbu.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  // Eliminar espacios y guiones
  const cleanCBU = cbu.replace(/[\s-]/g, '');

  // Debe tener exactamente 22 dígitos
  if (!/^\d{22}$/.test(cleanCBU)) {
    return {
      valid: false,
      error: 'El CBU debe tener exactamente 22 dígitos',
    };
  }

  // Validar dígitos verificadores
  // Los primeros 8 dígitos son el código de banco + sucursal + dígito verificador
  const bankCode = cleanCBU.substring(0, 7);
  const bankCheckDigit = parseInt(cleanCBU[7]);
  
  // Los siguientes 14 dígitos son la cuenta + dígito verificador
  const accountCode = cleanCBU.substring(8, 21);
  const accountCheckDigit = parseInt(cleanCBU[21]);

  // Algoritmo de validación de dígito verificador (módulo 10)
  const calculateCheckDigit = (code: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += parseInt(code[i]) * weights[i % weights.length];
    }
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
  };

  const bankWeights = [7, 1, 3, 9, 7, 1, 3];
  const accountWeights = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

  const calculatedBankCheck = calculateCheckDigit(bankCode, bankWeights);
  const calculatedAccountCheck = calculateCheckDigit(accountCode, accountWeights);

  if (calculatedBankCheck !== bankCheckDigit) {
    return {
      valid: false,
      error: 'CBU inválido: dígito verificador de banco incorrecto',
    };
  }

  if (calculatedAccountCheck !== accountCheckDigit) {
    return {
      valid: false,
      error: 'CBU inválido: dígito verificador de cuenta incorrecto',
    };
  }

  return { valid: true };
}

/**
 * Valida formato de IBAN (Internacional)
 */
export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  if (!iban || iban.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  // Eliminar espacios
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Formato básico: 2 letras + 2 dígitos + hasta 30 caracteres alfanuméricos
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleanIBAN)) {
    return {
      valid: false,
      error: 'Formato de IBAN inválido (debe comenzar con 2 letras y 2 dígitos)',
    };
  }

  // Longitudes específicas por país
  const ibanLengths: Record<string, number> = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
    BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
    DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
    GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
    IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
    LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
    MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29,
    PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24,
    SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
  };

  const countryCode = cleanIBAN.substring(0, 2);
  const expectedLength = ibanLengths[countryCode];

  if (expectedLength && cleanIBAN.length !== expectedLength) {
    return {
      valid: false,
      error: `IBAN de ${countryCode} debe tener ${expectedLength} caracteres`,
    };
  }

  // Validar dígito de control (algoritmo mod-97)
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);
  const numericIBAN = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Calcular módulo 97 para números grandes
  let remainder = '';
  for (const digit of numericIBAN) {
    remainder += digit;
    const num = parseInt(remainder);
    remainder = (num % 97).toString();
  }

  if (parseInt(remainder) !== 1) {
    return {
      valid: false,
      error: 'IBAN inválido: dígito de control incorrecto',
    };
  }

  return { valid: true };
}

/**
 * Valida CBU o IBAN automáticamente
 */
export function validateCBUorIBAN(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  const cleanValue = value.replace(/\s/g, '');

  // Si empieza con letras, es IBAN
  if (/^[A-Z]{2}/.test(cleanValue.toUpperCase())) {
    return validateIBAN(value);
  }

  // Si son solo dígitos, es CBU
  if (/^\d+$/.test(cleanValue)) {
    return validateCBU(value);
  }

  return {
    valid: false,
    error: 'Formato no reconocido. Debe ser CBU (22 dígitos) o IBAN (código de país + dígitos)',
  };
}

/**
 * Valida coordenadas GPS (latitud y longitud)
 */
export function validateLatitude(lat: string): { valid: boolean; error?: string } {
  if (!lat || lat.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  const latitude = parseFloat(lat);

  if (isNaN(latitude)) {
    return {
      valid: false,
      error: 'La latitud debe ser un número válido',
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: 'La latitud debe estar entre -90 y 90 grados',
    };
  }

  return { valid: true };
}

export function validateLongitude(lng: string): { valid: boolean; error?: string } {
  if (!lng || lng.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  const longitude = parseFloat(lng);

  if (isNaN(longitude)) {
    return {
      valid: false,
      error: 'La longitud debe ser un número válido',
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: 'La longitud debe estar entre -180 y 180 grados',
    };
  }

  return { valid: true };
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: true }; // Campo opcional en algunos casos
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Formato de email inválido',
    };
  }

  return { valid: true };
}

/**
 * Valida formato de teléfono español
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  // Eliminar espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Formato español: 9 dígitos, puede empezar con +34
  const phoneRegex = /^(\+34)?[6-9]\d{8}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Teléfono inválido. Debe tener 9 dígitos (puede incluir +34)',
    };
  }

  return { valid: true };
}

/**
 * Valida formato de DNI/NIF español
 */
export function validateDNI(dni: string): { valid: boolean; error?: string } {
  if (!dni || dni.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  const cleanDNI = dni.toUpperCase().replace(/[\s-]/g, '');

  // DNI: 8 dígitos + letra
  const dniRegex = /^(\d{8})([A-Z])$/;
  const match = cleanDNI.match(dniRegex);

  if (!match) {
    return {
      valid: false,
      error: 'DNI inválido. Debe tener 8 dígitos seguidos de una letra',
    };
  }

  // Validar letra de control
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(match[1]);
  const letter = match[2];
  const expectedLetter = letters[number % 23];

  if (letter !== expectedLetter) {
    return {
      valid: false,
      error: `DNI inválido. La letra correcta para ${match[1]} es ${expectedLetter}`,
    };
  }

  return { valid: true };
}

/**
 * Valida formato de CIF español
 */
export function validateCIF(cif: string): { valid: boolean; error?: string } {
  if (!cif || cif.trim() === '') {
    return { valid: true }; // Campo opcional
  }

  const cleanCIF = cif.toUpperCase().replace(/[\s-]/g, '');

  // CIF: letra + 7 dígitos + letra o dígito
  const cifRegex = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/;
  const match = cleanCIF.match(cifRegex);

  if (!match) {
    return {
      valid: false,
      error: 'CIF inválido. Debe tener formato: letra + 7 dígitos + letra/dígito',
    };
  }

  return { valid: true };
}

/**
 * Formatea CBU con espacios para mejor legibilidad
 */
export function formatCBU(cbu: string): string {
  const clean = cbu.replace(/[\s-]/g, '');
  if (clean.length !== 22) return cbu;
  
  // Formato: XXXX XXXX X XXXXXXXXXXXXX X
  return `${clean.substring(0, 4)} ${clean.substring(4, 8)} ${clean[8]} ${clean.substring(9, 21)} ${clean[21]}`;
}

/**
 * Formatea IBAN con espacios para mejor legibilidad
 */
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || iban;
}
