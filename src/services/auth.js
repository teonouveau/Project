const ACCOUNTS_KEY = 'skwela_accounts'
const SESSION_KEY = 'skwela_user'
const PASSWORD_ITERATIONS = 120000
const PASSWORD_BITS = 256
const encoder = new TextEncoder()

function readAccounts() {
  const saved = localStorage.getItem(ACCOUNTS_KEY)
  if (!saved) return []

  let accounts
  try {
    accounts = JSON.parse(saved)
  } catch {
    throw new Error('Saved account data is invalid. Clear this site’s data and try again.')
  }
  if (!Array.isArray(accounts)) {
    throw new Error('Saved account data is invalid. Clear this site’s data and try again.')
  }
  return accounts
}

function encodeHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function decodeHex(value) {
  if (typeof value !== 'string' || value.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(value)) {
    return new Uint8Array()
  }
  return Uint8Array.from(value.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16))
}

function equalHex(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    key,
    PASSWORD_BITS,
  )
  return encodeHex(new Uint8Array(derivedBits))
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function validateCredentials(name, email, password) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    throw new Error('Enter a valid name.')
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 150
  ) {
    throw new Error('Enter a valid email address.')
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new Error('Password must be between 8 and 128 characters.')
  }
}

export async function registerAccount({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email)
  validateCredentials(name, normalizedEmail, password)

  const accounts = readAccounts()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with that email already exists.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    salt: encodeHex(salt),
    passwordHash: await hashPassword(password, salt),
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]))
}

export async function loginAccount(email, password) {
  const normalizedEmail = normalizeEmail(email)
  const account = readAccounts().find((item) => item.email === normalizedEmail)
  if (!account || typeof password !== 'string' || password.length > 128) {
    throw new Error('Invalid email or password.')
  }

  const salt = decodeHex(account.salt)
  if (salt.length !== 16) throw new Error('Saved account data is invalid.')
  const candidateHash = await hashPassword(password, salt)
  if (!equalHex(candidateHash, account.passwordHash)) {
    throw new Error('Invalid email or password.')
  }

  const user = { id: account.id, name: account.name, email: account.email }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export async function changeAccountPassword({ email, currentPassword, newPassword }) {
  const normalizedEmail = normalizeEmail(email)
  if (
    typeof newPassword !== 'string' ||
    newPassword.length < 8 ||
    newPassword.length > 128
  ) {
    throw new Error('Password must be between 8 and 128 characters.')
  }

  const accounts = readAccounts()
  const accountIndex = accounts.findIndex((item) => item.email === normalizedEmail)
  const account = accounts[accountIndex]
  if (!account || typeof currentPassword !== 'string' || currentPassword.length > 128) {
    throw new Error('Email or current password is incorrect.')
  }

  const salt = decodeHex(account.salt)
  if (salt.length !== 16) throw new Error('Saved account data is invalid.')
  const currentHash = await hashPassword(currentPassword, salt)
  if (!equalHex(currentHash, account.passwordHash)) {
    throw new Error('Email or current password is incorrect.')
  }

  const nextSalt = crypto.getRandomValues(new Uint8Array(16))
  accounts[accountIndex] = {
    ...account,
    salt: encodeHex(nextSalt),
    passwordHash: await hashPassword(newPassword, nextSalt),
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}
