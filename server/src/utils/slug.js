export function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Ensures a unique slug within a model
export async function uniqueSlug(Model, text, ignoreId) {
  const base = slugify(text) || 'item';
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) slug = `${base}-${i++}`;
  return slug;
}
