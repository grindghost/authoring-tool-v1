import PocketBase from 'pocketbase';

const pb = new PocketBase('https://jdb.pockethost.io');
// pb.authStore.save(process.env.POCKETBASE_API_KEY);

const authenticateAdmin = async () => {
  if (!pb.authStore.isValid) {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
    pb.autoCancellation(false);
    console.log('Authenticated as admin...');
  }
};
export const PocketBaseAdapter = () => ({
  async createUser(data) {
    try {
      await authenticateAdmin();
  
      const newUser = {
        email: data.email,
        name: data.name || 'Anonymous',
        image: data.image || null,
        emailVerified: data.emailVerified?.toISOString() || null, // Ensure correct format
        accounts: [], // Initialize relations
        sessions: [], // Initialize relations
      };
  
      console.log('Creating user with:', newUser);
      const createdUser = await pb.collection('nuxtauth_users').create(newUser);
      console.log('User created:', createdUser);
      return createdUser;
    } catch (error) {
      console.error('PocketBase Adapter Error - createUser:', error.message);
      throw new Error('Error creating user in PocketBase');
    }
  },
  async getUser(id) {
    try {
      console.log('Fetching user by ID:', id);
      await authenticateAdmin();
      const user = await pb.collection('nuxtauth_users').getOne(id);
      console.log('Fetched user:', user);
      return user;
    } catch (error) {
      console.error('PocketBase Adapter Error - getUser:', error.message);
      throw error;
    }
  },
  async getUserByEmail(email) {
    const users = await pb.collection('nuxtauth_users').getList(1, 1, { filter: `email="${email}"` });
    return users.items[0] || null;
  },
  async getUserByAccount({ provider, providerAccountId }) {
    try {
      await authenticateAdmin();
      const accounts = await pb.collection('accounts').getList(1, 1, {
        filter: `provider="${provider}" && providerAccountId="${providerAccountId}"`,
      });
      const account = accounts.items[0];
      console.log('Account fetched:', account);
  
      if (!account) return null;
  
      const user = await pb.collection('nuxtauth_users').getOne(account.userId);
      console.log('User fetched for account:', user);
      return user;
    } catch (error) {
      console.error('PocketBase Adapter Error - getUserByAccount:', error.message);
      throw new Error('Error fetching user by account in PocketBase');
    }
  },
  
  async updateUser(user) {
    const updatedUser = await pb.collection('nuxtauth_users').update(user.id, user);
    return updatedUser;
  },
  async deleteUser(userId) {
    await pb.collection('nuxtauth_users').delete(userId);
  },
  async linkAccount(account) {
    try {
      await authenticateAdmin();
  
      const accountData = {
        ...account,
        user: account.userId, // Link the `user` field
      };
  
      const createdAccount = await pb.collection('accounts').create(accountData);
  
      // Update the `accounts` field in the `nuxtauth_users` collection
      const user = await pb.collection('nuxtauth_users').getOne(account.userId);
      const updatedAccounts = [...(user.accounts || []), createdAccount.id];
      await pb.collection('nuxtauth_users').update(account.userId, {
        accounts: updatedAccounts,
      });
  
      console.log('Account linked to user:', createdAccount);
      return createdAccount;
    } catch (error) {
      console.error('PocketBase Adapter Error - linkAccount:', error.message);
      throw new Error('Error linking account in PocketBase');
    }
  },
  async unlinkAccount({ provider, providerAccountId }) {
    const accounts = await pb.collection('accounts').getList(1, 1, {
      filter: `provider="${provider}" && providerAccountId="${providerAccountId}"`,
    });
    if (accounts.items[0]) {
      await pb.collection('accounts').delete(accounts.items[0].id);
    }
  },
  async createSession(session) {
    try {
      await authenticateAdmin();
      
      const expiresInDays = 30;
      const dynamicExpires = new Date();
      dynamicExpires.setDate(dynamicExpires.getDate() + expiresInDays);
  
      const sessionData = {
        ...session,
        expires: dynamicExpires.toISOString(), // Ensure ISO 8601 format
        user: session.userId, // Link the user
      };
  
      const createdSession = await pb.collection('sessions').create(sessionData);
  
      // Update the `sessions` field in the `nuxtauth_users` collection
      const user = await pb.collection('nuxtauth_users').getOne(session.userId);
      const updatedSessions = [...(user.sessions || []), createdSession.id];
      await pb.collection('nuxtauth_users').update(session.userId, {
        sessions: updatedSessions,
      });
  
      console.log('Session created and linked to user:', createdSession);
      createdSession.expires = dynamicExpires;
      return createdSession;
    
    } catch (error) {
      console.error('PocketBase Adapter Error - createSession:', error.message);
      throw new Error('Error creating session in PocketBase');
    }
  },
  async getSessionAndUser(sessionToken) {
    console.log('😎 PB Adapter | getSessionAndUser: Getting session and user for sessionToken:', sessionToken);
    await authenticateAdmin();
    try {
      const sessions = await pb.collection('sessions').getList(1, 1, {
        filter: `sessionToken="${sessionToken}"`,
      });
      const session = sessions.items[0];
  
      if (!session) return null;

      // Ensure `expires` is a valid Date object
      session.expires = new Date(session.expires);
    
      // const user = await this.getUser(session.userId);

      // Fetch user directly from PocketBase using `session.userId`
      const user = await pb.collection('nuxtauth_users').getOne(session.userId);

      // Return in the expected structure
      const result = {
        session: {
          sessionToken: session.sessionToken,
          expires: session.expires,
          userId: session.userId,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      };

  
      return result;
    } catch (error) {
      console.error('PocketBase Adapter Error - getSessionAndUser:', error.message);
      throw error;
    }
  },
  
  async updateSession(session) {
    console.log('👽 Updating session:', session);
    
    // const updatedSession = await pb.collection('sessions').update(session.id, session);    
    
    const updatedSession = await pb.collection('sessions').getList(1, 1, {
      filter: `sessionToken="${session.sessionToken}"`,
    });
    
    return updatedSession[0];
  },
  async deleteSession(sessionToken) {
    const sessions = await pb.collection('sessions').getList(1, 1, {
      filter: `sessionToken="${sessionToken}"`,
    });
    if (sessions.items[0]) {
      await pb.collection('sessions').delete(sessions.items[0].id);
    }
  },
  async createVerificationToken(token) {
    const createdToken = await pb.collection('verificationTokens').create(token);
    return createdToken;
  },
  async useVerificationToken({ identifier, token }) {
    const tokens = await pb.collection('verificationTokens').getList(1, 1, {
      filter: `identifier="${identifier}" && token="${token}"`,
    });
    const verificationToken = tokens.items[0];
    if (verificationToken) {
      await pb.collection('verificationTokens').delete(verificationToken.id);
      return verificationToken;
    }
    return null;
  },
});
