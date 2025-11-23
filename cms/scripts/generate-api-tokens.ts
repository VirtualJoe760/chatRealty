import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST, before importing Payload config
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function generateAPITokens() {
  console.log('='.repeat(80));
  console.log('PAYLOAD CMS - GENERATE API ACCESS TOKENS');
  console.log('='.repeat(80));
  console.log();

  // Debug: Check environment variables
  console.log('🔍 Environment Check:');
  console.log(`   PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log();

  try {
    console.log('📦 Initializing Payload CMS...');

    // Dynamically import Payload and config AFTER env vars are loaded
    const { default: payload } = await import('payload');
    const { default: config } = await import('../payload.config.js');

    // Initialize Payload without starting the server
    await payload.init({
      config,
    });

    console.log('✅ Payload initialized successfully');
    console.log();

    // Generate secure random passwords
    const publicPassword = crypto.randomBytes(32).toString('hex');
    const privatePassword = crypto.randomBytes(32).toString('hex');

    console.log('👤 Creating Public API User (agent role)...');
    const publicEmail = 'public-api@system.local';

    let publicUser;
    try {
      publicUser = await payload.create({
        collection: 'users',
        data: {
          email: publicEmail,
          password: publicPassword,
          role: 'agent',
        },
      });
      console.log(`   ✅ Created: ${publicEmail}`);
    } catch (err: any) {
      if (err.message && err.message.includes('duplicate')) {
        console.log(`   ⚠️  User already exists: ${publicEmail}`);
        // Find existing user
        const users = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: publicEmail,
            },
          },
        });
        publicUser = users.docs[0];

        // Update password to new one
        publicUser = await payload.update({
          collection: 'users',
          id: publicUser.id,
          data: {
            password: publicPassword,
          },
        });
        console.log(`   ✅ Updated password for existing user`);
      } else {
        throw err;
      }
    }

    console.log();
    console.log('👤 Creating Private API User (admin role)...');
    const privateEmail = 'private-api@system.local';

    let privateUser;
    try {
      privateUser = await payload.create({
        collection: 'users',
        data: {
          email: privateEmail,
          password: privatePassword,
          role: 'admin',
        },
      });
      console.log(`   ✅ Created: ${privateEmail}`);
    } catch (err: any) {
      if (err.message && err.message.includes('duplicate')) {
        console.log(`   ⚠️  User already exists: ${privateEmail}`);
        // Find existing user
        const users = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: privateEmail,
            },
          },
        });
        privateUser = users.docs[0];

        // Update password to new one
        privateUser = await payload.update({
          collection: 'users',
          id: privateUser.id,
          data: {
            password: privatePassword,
          },
        });
        console.log(`   ✅ Updated password for existing user`);
      } else {
        throw err;
      }
    }

    console.log();
    console.log('🔐 Logging in to generate JWT tokens...');
    console.log();

    // Login as public API user to get JWT token
    const publicLogin = await payload.login({
      collection: 'users',
      data: {
        email: publicEmail,
        password: publicPassword,
      },
    });

    // Login as private API user to get JWT token
    const privateLogin = await payload.login({
      collection: 'users',
      data: {
        email: privateEmail,
        password: privatePassword,
      },
    });

    console.log('='.repeat(80));
    console.log('✅ API TOKENS GENERATED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log();
    console.log('📋 PUBLIC API TOKEN (agent role):');
    console.log(publicLogin.token);
    console.log();
    console.log('📋 PRIVATE API TOKEN (admin role):');
    console.log(privateLogin.token);
    console.log();
    console.log('='.repeat(80));
    console.log('💾 Save these tokens to your .env file:');
    console.log('='.repeat(80));
    console.log();
    console.log('PUBLIC_CMS_TOKEN=' + publicLogin.token);
    console.log('PRIVATE_CMS_TOKEN=' + privateLogin.token);
    console.log();
    console.log('='.repeat(80));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error generating API tokens:');
    console.error(err);
    process.exit(1);
  }
}

generateAPITokens();
