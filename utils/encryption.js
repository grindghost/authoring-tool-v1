import CryptoJS from 'crypto-js'; // Import CryptoJS

export async function encryptContent(content) {

    // const config = useRuntimeConfig();
    const secretKey = process.env.SECRET_KEY;
  
    const token = CryptoJS.AES.encrypt(content, secretKey).toString();
    console.log('token', token);
    return token;
  }