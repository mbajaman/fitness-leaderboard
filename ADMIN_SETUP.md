# Admin Settings Setup

This document provides instructions for setting up the admin settings functionality in the Fitness Leaderboard application.

## Overview

The application includes an admin settings feature that requires password authentication. This allows administrators to access special functionality that regular users cannot access.

## Setting Up the Admin Table in Supabase

1. **Create the account table in Supabase**

   You can create the table using the Supabase SQL Editor. Run the following SQL:

   ```sql
   CREATE TABLE account (
     id SERIAL PRIMARY KEY,
     password TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Insert a default admin password**

   After creating the table, insert a default password. The application supports multiple password formats:

   - **Option 1: Plain text password (not recommended for production)**
     ```sql
     INSERT INTO account (password) VALUES ('your_secure_password');
     ```

   - **Option 2: Bcrypt hashed password (recommended)**
     ```sql
     INSERT INTO account (password) VALUES ('$2a$10$YourBcryptHashHere');
     ```
     You can generate a bcrypt hash using online tools or the bcryptjs library.

   - **Option 3: Salt-prefixed password**
     ```sql
     INSERT INTO account (password) VALUES ('bf_your_secure_password');
     ```
     Where 'bf' is the salt value from your .env file.

3. **Configure the salt in .env**

   Make sure your .env file contains the password salt:

   ```
   REACT_APP_PASSWORD_SALT=bf
   ```

   This salt is used for password hashing with the Blowfish algorithm.

## Using the Admin Settings

1. **Accessing Admin Settings**
   - Click the settings icon in the top-right corner of the application
   - Enter the admin password when prompted

2. **Admin Functionality**
   - Once authenticated, you'll have access to admin-only features
   - These features can be customized in the `Settings.js` component

## Password Authentication

The application supports multiple password authentication methods:

1. **Bcrypt Hashing**
   - The application uses the bcryptjs library for Blowfish password hashing
   - Passwords stored with bcrypt hashes (starting with $2a$, $2b$, or $2y$) are authenticated using bcrypt.compareSync()
   - The salt from the .env file is used in the hashing process

2. **Salt Prefixing**
   - Passwords can be stored with the salt as a prefix (e.g., 'bf_password')
   - The application will check for this format during authentication

3. **Custom Hashing**
   - The application attempts multiple hashing methods to accommodate different storage formats
   - For debugging, authentication attempts are logged to the console

## Security Considerations

- Use bcrypt hashed passwords for production environments
- Change the default password immediately after setup
- Consider implementing more secure authentication methods for production
- Implement rate limiting for authentication attempts to prevent brute force attacks

## Troubleshooting

If you encounter issues with the admin settings:

1. Check that the `account` table exists in your Supabase database
2. Verify that there is at least one row in the table with a valid password
3. Check the browser console for authentication logs and error messages
4. Ensure your Supabase connection is properly configured in `.env`
5. Verify that the REACT_APP_PASSWORD_SALT value in .env matches what was used to create the password 