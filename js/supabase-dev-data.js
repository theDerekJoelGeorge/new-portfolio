// Local stand-ins used while window.SUPABASE_PAUSED is true (no API or Storage egress).
(function () {
  window.SUPABASE_DEV_PROJECTS = [
    {
      id: 'dev-unmoot',
      slug: 'unmoot',
      name: 'Unmoot: Improving Class Participation',
      year: 2025,
      role: 'Product Designer',
      hero_image_url: '',
      hero_description: 'Development mode — Supabase fetching is paused.',
      is_published: true,
    },
    {
      id: 'dev-seasaw',
      slug: 'seasaw',
      name: 'SeaSaw - Exploring Collaboration and Non-Verbal Communication Through Physical Balance',
      year: 2025,
      role: 'Interaction Designer',
      hero_image_url: '',
      hero_description: 'Development mode — Supabase fetching is paused.',
      is_published: true,
    },
    {
      id: 'dev-eventhive',
      slug: 'eventhive',
      name: 'EventHive - Your Hub for events at UQ',
      year: 2024,
      role: 'Product Designer',
      hero_image_url: '',
      hero_description: 'Development mode — Supabase fetching is paused.',
      is_published: true,
    },
  ];

  window.SUPABASE_DEV_PHOTO_LOGS = Array.from({ length: 10 }, function (_, index) {
    return {
      id: 'dev-photo-' + (index + 1),
      category_id: 1,
      title: 'Photo ' + (index + 1),
      image_url: '',
    };
  });

  window.SUPABASE_DEV_VIDEO_LOGS = [];

  window.SUPABASE_DEV_WRITINGS = [
    {
      id: 'dev-writing-1',
      category_id: 4,
      title: 'Survivor',
      entry: 'She walked into his story\nCreated something that changed it',
      Type: 'Poems',
      'Cover Image': '',
    },
    {
      id: 'dev-writing-2',
      category_id: 4,
      title: 'Is Happiness just a fantasy ?',
      entry: 'Happiness.\nWhat is happiness?',
      Type: 'Thoughts',
      'Cover Image': '',
    },
  ];

  window.getSupabaseDevProjectBySlug = function (slug) {
    return window.SUPABASE_DEV_PROJECTS.find(function (p) {
      return p.slug === slug;
    }) || null;
  };
})();
