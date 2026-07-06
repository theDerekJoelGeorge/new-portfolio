(function () {
  const el = document.getElementById('brisbaneTime');
  if (!el) return;

  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const update = function () {
    const now = new Date();
    el.textContent = formatter.format(now);
    el.setAttribute('datetime', now.toISOString());
  };

  update();
  window.setInterval(update, 1000);
})();
