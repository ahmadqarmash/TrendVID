/**
 * Trending page player: the YouTube iframe is created only when a video is played
 * (privacy-enhanced youtube-nocookie.com host), and removed again on close to stop playback.
 */
const dialog = document.querySelector('[data-player]');
const frame = dialog?.querySelector('[data-player-frame]');
const watch = dialog?.querySelector('[data-player-watch]');

function open(id, title) {
  if (!dialog || typeof dialog.showModal !== 'function') {
    window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, '_blank', 'noopener');
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
  iframe.title = title || 'YouTube';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.replaceChildren(iframe);
  watch.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  dialog.showModal();
  if (typeof window.gtag === 'function') window.gtag('event', 'video_play', { video_id: id });
}

function close() {
  frame?.replaceChildren();
  if (dialog?.open) dialog.close();
}

document.querySelectorAll('[data-play]').forEach((button) => {
  button.addEventListener('click', () => open(button.dataset.play, button.dataset.title));
});
dialog?.querySelector('[data-player-close]')?.addEventListener('click', close);
dialog?.addEventListener('close', () => frame?.replaceChildren());
dialog?.addEventListener('click', (event) => { if (event.target === dialog) close(); });
