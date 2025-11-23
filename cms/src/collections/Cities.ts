import { CollectionConfig } from 'payload';
import { generateSlug } from '../hooks/slugify';
import { getPreviewUrl } from '../utils/preview';

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    preview: ({ data }: any) => {
      if (!data?.slug) return '';
      return getPreviewUrl('cities', data.slug as string);
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

          // Revalidate specific city page
          await fetch(`${baseUrl}/api/revalidate?collection=cities&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths (homepage, cities index) - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (cities):", err);
        }
      }
    ],
    afterDelete: [
      async ({ doc }: any) => {
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Revalidate specific city page
          await fetch(`${baseUrl}/api/revalidate?collection=cities&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (cities delete):", err);
        }
      }
    ]
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'richText' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
  ],
};
