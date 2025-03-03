import { supabase } from './supabaseClient';

/**
 * This script sets up the admin_settings table in Supabase
 * Run this script once to initialize the admin settings with a default password
 *
 * Usage:
 * 1. Set your default admin password below
 * 2. Run this script with: node setupAdminTable.js
 * 3. After running, you can delete this file or keep it for reference
 */

const DEFAULT_ADMIN_PASSWORD = 'admin123'; // Change this to your desired default password

const setupAdminTable = async () => {
  try {
    console.log('Setting up admin_settings table...');

    // Check if the table exists by trying to select from it
    const { error: checkError } = await supabase.from('admin_settings').select('id').limit(1);

    // If the table doesn't exist, create it
    if (checkError && checkError.code === '42P01') {
      // PostgreSQL error code for undefined_table
      console.log('Table does not exist. Creating admin_settings table...');

      // Create the table using SQL (requires Supabase SQL editor or migration)
      // This part would typically be done in the Supabase dashboard SQL editor
      console.log('Please create the table manually in Supabase SQL editor with:');
      console.log(`
        CREATE TABLE admin_settings (
          id SERIAL PRIMARY KEY,
          password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    } else {
      console.log('Table already exists. Checking for admin password...');
    }

    // Check if there's already an admin password set
    const { data: existingData, error: fetchError } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1);

    if (fetchError && fetchError.code !== '42P01') {
      throw fetchError;
    }

    // If no admin password exists, insert the default one
    if (!existingData || existingData.length === 0) {
      console.log('No admin password found. Setting up default password...');

      const { data, error: insertError } = await supabase
        .from('admin_settings')
        .insert([{ password: DEFAULT_ADMIN_PASSWORD }]);

      if (insertError) {
        throw insertError;
      }

      console.log('Default admin password set successfully!');
      console.log('IMPORTANT: Please change this password in production!');
    } else {
      console.log('Admin password already exists. No changes made.');
    }

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Error setting up admin table:', error);
  }
};

// Run the setup function
setupAdminTable();

export default setupAdminTable;
