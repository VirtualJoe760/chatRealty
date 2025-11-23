import { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'filename' },

  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },

  upload: {
    staticDir: 'media',
    disableLocalStorage: false,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: {
          format: 'jpeg',
          options: {
            quality: 80,
            progressive: true,
          },
        },
      },
      {
        name: 'large',
        width: 1600,
        height: undefined,
        position: 'centre',
        formatOptions: {
          format: 'jpeg',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'hero',
        width: 2400,
        height: undefined,
        position: 'centre',
        formatOptions: {
          format: 'jpeg',
          options: {
            quality: 90,
          },
        },
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },

  hooks: {
    afterRead: [
      ({ doc }) => {
        // If URL already starts with http, it's already a cloud URL
        if (doc.url?.startsWith('http')) return doc

        // If DO Spaces is configured, rewrite URLs to point to cloud storage
        if (process.env.DO_SPACES_BUCKET && process.env.DO_SPACES_ENDPOINT) {
          doc.url = `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${doc.filename}`

          // Also rewrite image size URLs if they exist
          if (doc.sizes) {
            Object.keys(doc.sizes).forEach((size) => {
              if (doc.sizes[size].filename) {
                doc.sizes[size].url = `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${doc.sizes[size].filename}`
              }
            })
          }
        }

        return doc
      },
    ],
    afterChange: [
      async ({ doc }: any) => {
        // Step 29: Revalidate global paths when media changes
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Trigger global revalidation (homepage, blog pages, cities index, etc.)
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (media):", err);
        }
      }
    ],
    afterDelete: [
      async ({ doc }: any) => {
        // Step 29: Revalidate global paths when media is deleted
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Trigger global revalidation
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (media delete):", err);
        }
      }
    ],
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
