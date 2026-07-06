// Shared Supabase Storage URL resolver – use on all pages that load images/video from Storage.
(function () {
  var url = window.SUPABASE_URL;
  var bucket = window.SUPABASE_STORAGE_BUCKET || 'images';
  var useTransform = window.SUPABASE_IMAGE_TRANSFORM === true;

  function isImagePath(path) {
    return /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|ico)$/i.test(path);
  }

  window.resolveSupabaseStorageUrl = function (raw, opts) {
    if (!raw || typeof raw !== 'string') return '';
    var s = raw.trim();
    if (!s) return '';
    if (s.indexOf('http://') === 0 || s.indexOf('https://') === 0) return s;
    if (!url) return '';
    var path = s.charAt(0) === '/' ? s.slice(1) : s;
    if (path.indexOf(bucket + '/') !== 0) path = bucket + '/' + path;
    var applyTransform = opts && 'transform' in opts ? opts.transform : useTransform;
    if (applyTransform && isImagePath(path)) {
      return url + '/storage/v1/render/image/public/' + path + '?width=1200&quality=75';
    }
    return url + '/storage/v1/object/public/' + path;
  };
})();
