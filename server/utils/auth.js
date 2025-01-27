import CryptoJS from 'crypto-js'

export const encryptContent = async (content) => {
  return CryptoJS.AES.encrypt(content, process.env.SECRET_KEY).toString()
}

export const decryptContent = async (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}