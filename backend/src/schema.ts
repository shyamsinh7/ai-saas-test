import { z } from 'zod';

const text = z.string().trim().min(1);
const href = z
  .string()
  .regex(/^(https?:\/\/|mailto:|tel:)\S+$/, 'must be an http(s), mailto or tel link');

const isoDate = z.iso.date();

export const profileSchema = z.object({
  name: text,
  title: text,
  description: text,
  updatedAt: isoDate.optional(),
  contacts: z.array(z.object({ label: text, value: text, href: href.optional() })).min(1),
  about: z.object({
    summary: text,
    highlights: z.array(z.object({ title: text, text })),
  }),
  skills: z.array(z.object({ category: text, items: z.array(text).min(1) })).min(1),
  portfolio: z
    .array(
      z.object({
        name: text,
        description: text,
        summary: text,
        category: text,
        tags: z.array(text).min(1),
        url: z.url({ protocol: /^https?$/ }).optional(),
        urlLabel: text.optional(),
      }),
    )
    .min(1),
  why: z.array(text),
});

export type Profile = z.infer<typeof profileSchema>;

export function parseProfile(data: unknown): Profile {
  return profileSchema.parse(data);
}
