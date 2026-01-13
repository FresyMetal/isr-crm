/**
 * Validaciones compartidas entre frontend y backend
 */

export function isValidEmail(email: string): boolean {
  if (!email) return true; // Opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Opcional
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const phoneRegex = /^(\+34)?[6-9]\d{8}$/;
  return phoneRegex.test(cleanPhone);
}

export function isValidLatitude(lat: string | number): boolean {
  if (!lat) return true; // Opcional
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(lng: string | number): boolean {
  if (!lng) return true; // Opcional
  const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
}

export function isValidCBU(cbu: string): boolean {
  if (!cbu) return true; // Opcional
  const cleanCBU = cbu.replace(/[\s-]/g, '');
  
  // Debe tener exactamente 22 dígitos
  if (!/^\d{22}$/.test(cleanCBU)) {
    return false;
  }

  // Validar dígitos verificadores
  const bankCode = cleanCBU.substring(0, 7);
  const bankCheckDigit = parseInt(cleanCBU[7]);
  const accountCode = cleanCBU.substring(8, 21);
  const accountCheckDigit = parseInt(cleanCBU[21]);

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

  return calculatedBankCheck === bankCheckDigit && calculatedAccountCheck === accountCheckDigit;
}

export function isValidIBAN(iban: string): boolean {
  if (!iban) return true; // Opcional
  
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Formato básico
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleanIBAN)) {
    return false;
  }

  // Validar dígito de control (algoritmo mod-97)
  const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);
  const numericIBAN = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  let remainder = '';
  for (const digit of numericIBAN) {
    remainder += digit;
    const num = parseInt(remainder);
    remainder = (num % 97).toString();
  }

  return parseInt(remainder) === 1;
}

export function isValidCBUorIBAN(value: string): boolean {
  if (!value) return true;
  
  const cleanValue = value.replace(/\s/g, '');
  
  // Si empieza con letras, es IBAN
  if (/^[A-Z]{2}/.test(cleanValue.toUpperCase())) {
    return isValidIBAN(value);
  }
  
  // Si son solo dígitos, es CBU
  if (/^\d+$/.test(cleanValue)) {
    return isValidCBU(value);
  }
  
  return false;
}
