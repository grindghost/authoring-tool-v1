import CryptoJS from 'crypto-js'
import { randomBytes } from 'crypto';
import * as cheerio from 'cheerio';

const BACKPACK_TOKEN_LENGTH = 64;

export const generateUniqueID = (idLength) => {
  return randomBytes(Math.ceil(idLength / 2)) // Generate enough random bytes
    .toString('hex') // Convert bytes to hexadecimal string
    .slice(0, idLength); // Trim to the desired length
};

// Helper function to encrypt content
export const encryptContent = async (content) => {
  return CryptoJS.AES.encrypt(content, process.env.SECRET_KEY).toString()
}

// Helper function to decrypt content
export const decryptContent = async (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, process.env.SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Helper function to create a new user in Pocketbase
export const createNewUser = async (pb, name, mbox) => {
  try {
    // Step 1: Retrieve the current collection value from the 'configs' collection
    const globalConfig = await pb.collection('Configs').getFirstListItem(`name = 'global'`);
    const currentCollection = globalConfig.currentCollection;

    console.log(`Current collection: ${currentCollection}`);

    // Step 2: Generate a new backpack ID
    let newBackpackId = generateUniqueID(BACKPACK_TOKEN_LENGTH); // Generate a unique ID

    // Add 'dev-' prefix if in development mode
    if (process.env.NODE_ENV === 'development') {
      newBackpackId = `dev-${newBackpackId}`;
      
      // Ensure the length of the final ID is exactly 15 characters
      newBackpackId = newBackpackId.slice(0, BACKPACK_TOKEN_LENGTH); // Truncate to X chars
    }

    // Step 3: Encrypt the new backpack ID
    const encryptedBackpackId = await encryptContent(newBackpackId);
    const creationDate = new Date().toISOString(); // Format to ISO 8601

    // Step 4: Store the new user data in the 'backpacks' collection
    await pb.collection('Backpacks').create({
      token: newBackpackId,
      creationDate: creationDate,
      collection: currentCollection,
      name: name,
      email: mbox,
    });

    console.log(`New user created with unique token: ${newBackpackId}`);
    return encryptedBackpackId;
  } catch (error) {
    console.error('Failed to create new user:', error.message);
    throw new Error('Failed to create new user');
  }
};

// Helper function to validate or create a new user (v2)
export const validateOrCreateUser = async (pb, backpackId, req, name, mbox) => {
  const secretKey = process.env.SECRET_KEY;
  const DEFAULT_NAME = "Unknown User";
  const DEFAULT_EMAIL = "mailto:unknown@mail.com";

  try {
    // Check if name and mbox are valid (not undefined/null and not default values)
    const isValidName = name && name !== DEFAULT_NAME;
    const isValidEmail = mbox && mbox !== DEFAULT_EMAIL;

    // First check if a user with the same name and email already exists,
    // but only if both values are valid (not defaults or empty)
    if (isValidName && isValidEmail) {
      try {
        const existingUser = await pb.collection('Backpacks').getFirstListItem(`name = '${name}' && email = '${mbox}'`);
        if (existingUser) {
          console.log('Found existing user with matching name and email');
          const encryptedbackpackId = existingUser.token ? await encryptContent(existingUser.token, secretKey) : null;
          return {
            valid: true,
            backpackId: encryptedbackpackId,
            decryptedbackpackId: existingUser.token,
            existing: true
          };
        }
      } catch (error) {
        console.log('No existing user found with matching name and email');
        // Continue with the rest of the function if no matching user is found
      }
    } else {
      console.log('Skipping name/email lookup due to default or empty values:', 
                  { isValidName, isValidEmail, name, mbox });
    }

    if (backpackId && backpackId !== 'defaultbackpackId') {

      console.log('backpackId received from the query:', backpackId);

      // Step 1: Decrypt the backpackId
      const decryptedbackpackId = await decryptContent(backpackId, secretKey);

      // Validate the decrypted key
      if (!decryptedbackpackId || decryptedbackpackId.length < BACKPACK_TOKEN_LENGTH) {
        console.log(decryptedbackpackId.length);
        throw new Error('Invalid user key format');
      }

      // Step 2: Check if the user exists in Pocketbase
      try {
        const user = await pb.collection('Backpacks').getFirstListItem(`token = '${decryptedbackpackId}'`);
        // If the backpack with the given token exists, return the decrypted token
        return { valid: true, backpackId, decryptedbackpackId };
      } catch (error) {
        // If user doesn't exist, create a new one
        console.log('User not found with token, attempting to create a new one');
        
        // Use fallback username/email if the provided ones are the defaults
        // const userName = isValidName ? name : `User_${Date.now().toString().slice(-6)}`;
        // const userEmail = isValidEmail ? mbox : `user_${Date.now().toString().slice(-6)}@mail.com`;
        const userName = 'anonymous';
        const userEmail = 'unknown@mail.com';
        
        try {
          const newEncryptedbackpackId = await createNewUser(pb, userName, userEmail);
          const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

          return {
            valid: true,
            backpackId: newEncryptedbackpackId,
            decryptedbackpackId: decryptedbackpackId,
            newlyCreated: true
          };
        } catch (createError) {
          console.error('Failed during user creation:', createError.message);
          throw new Error('Failed to create new user');
        }
      }
    } else {
      // If no valid backpackId is provided or it's the default, create a new user
      console.log('No valid backpackId, attempting to create a new user');
      
      // Use fallback username/email if the provided ones are the defaults
      // const userName = isValidName ? name : `User_${Date.now().toString().slice(-6)}`;
      // const userEmail = isValidEmail ? mbox : `user_${Date.now().toString().slice(-6)}@mail.com`;
      const userName = 'anonymous';
      const userEmail = 'unknown@mail.com';
      
      try {
        const newEncryptedbackpackId = await createNewUser(pb, userName, userEmail);
        const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

        return {
          valid: true,
          backpackId: newEncryptedbackpackId,
          decryptedbackpackId: decryptedbackpackId,
          newlyCreated: true
        };
      } catch (createError) {
        console.error('Failed during user creation:', createError.message);
        throw new Error('Failed to create new user');
      }
    }
  } catch (error) {
    console.error('User validation or creation error:', error.message);
    
    // Generate a random token as a fallback strategy when user creation fails
    try {
      console.log('Attempting fallback strategy: generating random token');
      // Generate a random token of appropriate length

      let newBackpackId = generateUniqueID(BACKPACK_TOKEN_LENGTH);
      const encryptedBackpackId = await encryptContent(newBackpackId);
      
      return {
        valid: true,
        backpackId: encryptedBackpackId,
        decryptedbackpackId: newBackpackId,
        newlyCreated: true,
        fallback: true
      };
    } catch (fallbackError) {
      console.error('Even fallback strategy failed:', fallbackError.message);
      throw new Error('Complete authentication failure');
    }
  }
};


// Helper function to validate or create a new user (v1)
export const _validateOrCreateUser = async (pb, backpackId, req, name, mbox) => {
  const secretKey = process.env.SECRET_KEY;

  try {
    if (backpackId && backpackId !== 'defaultbackpackId') {
      // Step 1: Decrypt the backpackId
      const decryptedbackpackId = await decryptContent(backpackId, secretKey);

      // Validate the decrypted key
      if (!decryptedbackpackId || decryptedbackpackId.length < BACKPACK_TOKEN_LENGTH) {
        console.log(decryptedbackpackId.length)
        throw new Error('Invalid user key format');
      }

      // Step 2: Check if the user exists in Pocketbase
      try {
        const user = await pb.collection('Backpacks').getFirstListItem(`token = '${decryptedbackpackId}'`);
        // If the backpack with the given token exists, return the decrypted token
        return { valid: true, backpackId, decryptedbackpackId };
      } catch (error) {
        // If user doesn't exist, create a new one
        console.log('User not found, creating a new one.');
        const newEncryptedbackpackId = await createNewUser(pb, name, mbox);
        const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

        return {
          valid: true,
          backpackId: newEncryptedbackpackId,
          decryptedbackpackId: decryptedbackpackId,
        };
      }
    } else {
      
      // If no valid backpackId is provided or it's the default, create a new user
      const newEncryptedbackpackId = await createNewUser(pb, name, mbox);
      const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);

      return {
        valid: true,
        backpackId: newEncryptedbackpackId,
        decryptedbackpackId: decryptedbackpackId,
      };
    }
  } catch (error) {
    console.error('User validation or creation error:', error.message);
    // In case of an error, create a new user
    const newEncryptedbackpackId = await createNewUser(pb, name, mbox);
    const decryptedbackpackId = await decryptContent(newEncryptedbackpackId, secretKey);
    return {
      valid: true,
      backpackId: newEncryptedbackpackId,
      decryptedbackpackId: decryptedbackpackId,
    };
  }
};

// ****************************************

export const convertQuillHtmlToText = (quillHtml) => {
  const $ = cheerio.load(quillHtml);
  let result = '';

  const listNumbering = { 0: 0, 1: 0, 2: 0, 3: 0 };

  const getOrderedListBullet = (level, index) => {
    const numberingStyles = ['1.', 'a.', 'i.'];
    const styleIndex = level % numberingStyles.length;
    return numberingStyles[styleIndex]
      .replace('1', index + 1)
      .replace('a', String.fromCharCode(97 + index))
      .replace('i', toRoman(index + 1));
  };

  const toRoman = (num) => {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  const processElement = (el, indentLevel = 0) => {
    const tag = $(el).prop('tagName') ? $(el).prop('tagName').toLowerCase() : '';

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p') {
      result += $(el).text().trim() + '\n\n';
    } else if (tag === 'ol' || tag === 'ul') {
      $(el).children().each((j, li) => {
        const indent = $(li).attr('class')?.match(/ql-indent-(\d+)/);
        const level = indent ? parseInt(indent[1]) : 0;

        listNumbering[level] = (listNumbering[level] || 0) + 1;
        for (let l = level + 1; l < 4; l++) listNumbering[l] = 0;

        const bullet = tag === 'ol' 
          ? getOrderedListBullet(level, listNumbering[level] - 1)
          : '•';

        result += '  '.repeat(level) + bullet + ' ' + $(li).text().trim() + '\n';
      });
      result += '\n';
    } else if ($(el).hasClass('ql-code-block')) {
      const codeText = $(el).text().split('\n').map(line => `  ${line}`).join('\n');
      result += `\n${codeText}\n\n`;
    } else {
      $(el).children().each((_, child) => processElement(child, indentLevel));
    }
  };

  $('body').children().each((_, el) => processElement(el));

  return result;
};


// Backup version of the function
export const convertQuillHtmlToText_V1 = (quillHtml) => {
  const $ = cheerio.load(quillHtml);
  let result = '';
  
  // Tracking numbering for different indentation levels
  const listNumbering = { 0: 0, 1: 0, 2: 0, 3: 0 }; 

  // Function to generate the ordered list style based on depth
  const getOrderedListBullet = (level, index) => {
    const numberingStyles = ['1.', 'a.', 'i.'];  // Add more styles as needed
    const styleIndex = level % numberingStyles.length;
    return numberingStyles[styleIndex].replace('1', index + 1).replace('a', String.fromCharCode(97 + index)).replace('i', toRoman(index + 1));
  };

  // Convert index to Roman numerals for deeper levels (you can extend this for larger numbers if needed)
  const toRoman = (num) => {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '', i;
    for ( i in lookup ) {
      while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  $('body').children().each((i, el) => {
    const tag = $(el).prop('tagName').toLowerCase();
    
    if (tag === 'h1' || tag === 'h2' ||  tag === 'h3' || tag === 'p') {
      // Handle headings and paragraphs
      result += $(el).text() + '\n\n';
    } else if (tag === 'ol' || tag === 'ul') {
      // Handle lists
      $(el).children().each((j, li) => {
        // Detect the indentation level
        const indentLevel = $(li).hasClass('ql-indent-1') ? 1 :
                            $(li).hasClass('ql-indent-2') ? 2 :
                            $(li).hasClass('ql-indent-3') ? 3 : 0;

        // Increment list numbering for this indentation level
        listNumbering[indentLevel] = listNumbering[indentLevel] + 1;

        // Reset numbering for deeper levels
        for (let level = indentLevel + 1; level < 4; level++) {
          listNumbering[level] = 0;
        }

        // Determine the bullet type (ordered or unordered)
        const bullet = tag === 'ol' 
          ? getOrderedListBullet(indentLevel, listNumbering[indentLevel] - 1) 
          : '•';

        // Create indentation based on the level
        const indentation = '  '.repeat(indentLevel);
        result += `${indentation}${bullet} ${$(li).text()}\n`;
      });
      result += '\n';
    }
  });

  return result;
}