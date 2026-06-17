export function required(value) {
  if (value == null || String(value).trim() === '') {
    return 'This is required'
  }
  return ''
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

export function phoneNumberDigits(value, { digits = 10 } = {}) {
  const err = required(value)
  if (err) return err

  const cleaned = String(value).replace(/\D/g, '')
  if (cleaned.length > digits) {
    return `Phone number cannot exceed ${digits} digits`
  }
  if (cleaned.length < digits) {
    return `Phone number must be ${digits} digits`
  }
  return ''
}
