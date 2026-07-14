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

  window.SUPABASE_DEV_VIBECODING_EXPERIMENTS = [
    {
      id: 'dev-vibecoding-1',
      title: 'Reworking this portfolio',
      status: 'building',
      hero_vid: '',
      link: '',
      sort_order: 0,
    },
    {
      id: 'dev-vibecoding-2',
      title: 'Thoughts',
      status: 'done',
      hero_vid: '',
      link: 'https://thoughtsinthesky.vercel.app/',
      sort_order: 1,
    },
  ];

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

  window.SUPABASE_DEV_ABOUT_ME = {
    'description 1':
      "I'm Derek, a Product Designer who has recently graduated from The University of Queensland with a Master of Interaction Design.",
    'paragraph 2':
      'I studied Electronics and Communication Engineering and worked as an analyst at Capgemini before moving to Australia. That structured way of thinking helped, but I wanted to work closer to the human side of products — which led me to HCI and UX/UI design.',
    'paragraph 3':
      'At UQ I learned to defend design decisions with research, not just taste. That discipline still shapes how I approach messy problems today.',
    'paragraph 4':
      'Right now I am building depth as a product designer — stronger research, sharper systems thinking, and more shipped work I can point to.',
    'paragraph 5':
      'Outside of work, I am usually behind a camera, tinkering with side projects, or hunting down good coffee around Brisbane.',
    'tldr-1': 'TL;DR — Engineering brain, design heart, Brisbane based.',
    'tldr-2': 'TL;DR — Always making things and asking too many questions.',
    'Hero Image': 'images/avatar.png'
  };
})();
