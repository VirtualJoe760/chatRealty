import { CollectionConfig } from 'payload';
import { generateSlug } from '../hooks/slugify';
import { getPreviewUrl } from '../utils/preview';

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    preview: ({ data }: any) => {
      if (!data?.slug) return '';
      return getPreviewUrl('blog-posts', data.slug as string);
    },
  },

  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'agent',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'agent',
    delete: ({ req }) => req.user?.role === 'admin',
  },

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }
      }
    ],
    afterChange: [
      async ({ doc }: any) => {
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Revalidate specific blog post page
          await fetch(`${baseUrl}/api/revalidate?collection=blog-posts&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (blog-posts):", err);
        }
      }
    ],
    afterDelete: [
      async ({ doc }: any) => {
        try {
          const secret = process.env.REVALIDATE_SECRET;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
          const secretParam = secret ? `&secret=${secret}` : '';

          // Revalidate specific blog post page
          await fetch(`${baseUrl}/api/revalidate?collection=blog-posts&slug=${doc.slug}${secretParam}`);

          // Revalidate global paths - Step 28
          await fetch(`${baseUrl}/api/revalidate?collection=global${secretParam}`);
        } catch (err) {
          console.error("Revalidate error (blog-posts delete):", err);
        }
      }
    ]
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, required: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'content', type: 'richText' },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
};
