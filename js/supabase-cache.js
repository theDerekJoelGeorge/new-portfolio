// localStorage cache for Supabase JSON responses (stale-while-revalidate after TTL).
(function () {
  var PREFIX = 'portfolio:supabase:';

  function cacheVersion() {
    return window.SUPABASE_CACHE_VERSION != null ? String(window.SUPABASE_CACHE_VERSION) : '1';
  }

  function cacheTtlMs() {
    return typeof window.SUPABASE_CACHE_TTL_MS === 'number' ? window.SUPABASE_CACHE_TTL_MS : 86400000;
  }

  function readEntry(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (!entry || entry.version !== cacheVersion()) return null;
      return entry;
    } catch (error) {
      return null;
    }
  }

  function writeEntry(key, data) {
    try {
      localStorage.setItem(
        PREFIX + key,
        JSON.stringify({
          version: cacheVersion(),
          fetchedAt: Date.now(),
          data: data,
        })
      );
    } catch (error) {
      console.warn('[portfolio] Could not write Supabase cache:', key, error);
    }
  }

  function isFresh(entry) {
    return !!entry && Date.now() - entry.fetchedAt < cacheTtlMs();
  }

  window.clearSupabaseCache = function () {
    try {
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var storageKey = localStorage.key(i);
        if (storageKey && storageKey.indexOf(PREFIX) === 0) {
          keysToRemove.push(storageKey);
        }
      }
      keysToRemove.forEach(function (storageKey) {
        localStorage.removeItem(storageKey);
      });
    } catch (error) {
      console.warn('[portfolio] Could not clear Supabase cache.', error);
    }
  };

  window.fetchWithSupabaseCache = async function (cacheKey, fetchFn, options) {
    options = options || {};
    var entry = readEntry(cacheKey);
    var onRevalidate = options.onRevalidate;

    async function revalidate() {
      try {
        var fresh = await fetchFn();
        writeEntry(cacheKey, fresh);
        if (typeof onRevalidate === 'function') {
          onRevalidate(fresh);
        }
      } catch (error) {
        console.warn('[portfolio] Supabase revalidate failed:', cacheKey, error);
      }
    }

    if (entry) {
      if (!isFresh(entry)) {
        revalidate();
      }
      return entry.data;
    }

    var data = await fetchFn();
    writeEntry(cacheKey, data);
    return data;
  };
})();
