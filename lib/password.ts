import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64

function scryptBuffer(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = await scryptBuffer(password, salt)

  return `scrypt:${salt}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, storedKey] = passwordHash.split(":")

  if (scheme !== "scrypt" || !salt || !storedKey) {
    return false
  }

  const storedBuffer = Buffer.from(storedKey, "hex")

  if (storedBuffer.length !== KEY_LENGTH) {
    return false
  }

  const derivedKey = await scryptBuffer(password, salt)

  return timingSafeEqual(storedBuffer, derivedKey)
}
