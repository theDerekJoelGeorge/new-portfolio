window.SUPABASE_URL = 'https://kftstjcyxaarrsqnbape.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_3H6mMml6i6GQgcT_v18FlA_GujwTbac';
window.SUPABASE_PROJECTS_TABLE = 'projects';
window.SUPABASE_CATEGORY_ENTRIES_TABLE = 'category_entries';
window.SUPABASE_ABOUT_ME_TABLE = 'about_me';
window.SUPABASE_VIBECODING_TABLE = 'vibecoding_experiments';
window.SUPABASE_STORAGE_BUCKET = 'Portfolio';
window.SUPABASE_IMAGE_TRANSFORM = false;

// Bump when you publish CMS changes in Supabase to invalidate cached content immediately.
window.SUPABASE_CACHE_VERSION = 5;
// How long cached JSON stays fresh before a background revalidate (24 hours).
window.SUPABASE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Set to false before deploying or when you need live Supabase content again.
window.SUPABASE_PAUSED = false;

window.isSupabasePaused = function () {
  return window.SUPABASE_PAUSED === true;
};
