import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from './src/collections/Users'
import { Cities } from './src/collections/Cities'
import { Neighborhoods } from './src/collections/Neighborhoods'
import { Schools } from './src/collections/Schools'
import { BlogPosts } from './src/collections/BlogPosts'
import { Contacts } from './src/collections/Contacts'
import { Media } from './src/collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Editor used by the admin panel
  editor: lexicalEditor({}),

  // CORS Configuration - Step 21
  cors: [
    'https://jpsrealtor.com',
    'https://www.jpsrealtor.com',
    'https://cms.jpsrealtor.com',
    'http://localhost:3000',
    'http://localhost:3002',
  ],

  // CSRF Protection - Step 21
  csrf: [
    'https://jpsrealtor.com',
    'https://www.jpsrealtor.com',
    'https://cms.jpsrealtor.com',
    'http://localhost:3000',
    'http://localhost:3002',
  ],

  // Collections
  collections: [
    Users,
    Media,
    Cities,
    Neighborhoods,
    Schools,
    BlogPosts,
    Contacts,
  ],

  // Plugins - Step 23: DigitalOcean Spaces Cloud Storage
  // Note: Cloud storage plugin temporarily disabled pending proper adapter configuration
  plugins: [],

  // Server URL - Step 22
  serverURL: process.env.NEXT_CMS_URL || 'https://cms.jpsrealtor.com',

  // Secret for JWT tokens
  secret: process.env.PAYLOAD_SECRET || 'YOUR_SECRET_HERE',

  // TypeScript configuration
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Database adapter
  db: mongooseAdapter({
    url: process.env.MONGODB_URI as string,
  }),

  // Email configuration - conditionally enable if SMTP credentials are set
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.EMAIL_FROM as string,
          defaultFromName: 'JPS Realtor',
          transport: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
        }),
      }
    : {}),

  // Admin configuration
  admin: {
    meta: {
      titleSuffix: '- JPSRealtor CMS',
    },
  },
})
