import { CollectionConfig } from 'payload';
import { generateSlug } from '../hooks/slugify';
import { getPreviewUrl } from '../utils/preview';

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: {
    useAsTitle: 'name',
    preview: ({ data }: any) => {
      if (!data?.slug) return '';
      return getPreviewUrl('schools', data.slug as string);
    },
  },

  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = generateSlug(data.name);
        }
      }
    ],
    afterChange: [
      async ({ doc }: any) => {
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Revalidate specific school page
          await fetch(`${baseUrl}/api/revalidate?collection=schools&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (schools):", err);
        }
      }
    ],
    afterDelete: [
      async ({ doc }: any) => {
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Revalidate specific school page
          await fetch(`${baseUrl}/api/revalidate?collection=schools&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (schools delete):", err);
        }
      }
    ]
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'district',
      type: 'select',
      options: [
        'Palm Springs Unified School District',
        'Desert Sands Unified School District',
        'Coachella Valley Unified School District',
        'Private School'
      ]
    },
    { name: 'address', type: 'text' },
    { name: 'coordinates', type: 'point' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText' },
    { name: 'phone', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'principal', type: 'text' },
  ],
};
