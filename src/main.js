// All invitation content is already in the HTML. Motion and music are optional.
document.querySelectorAll('.couple-photo, .cutout-art__image').forEach((image) => {
  const fallback = () => {
    const svg = image.closest('.cutout-art');
    if (svg) svg.style.display = 'none';
    else image.hidden = true;
    const slot = image.closest('.photo-slot');
    slot.classList.remove('photo-slot--cutout', 'photo-slot--photo', 'photo-slot--sticker');
    slot.classList.add('photo-slot--placeholder');
    slot.querySelector('.photo-placeholder').hidden = false;
  };
  image.addEventListener('error', fallback, { once: true });
  if (image.complete && !image.naturalWidth) fallback();
});

if ('IntersectionObserver' in window) {
  // Pause photo and calendar movement outside the viewport.
  const photoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      target.classList.toggle('is-in-view', isIntersecting);
    });
  });
  document.documentElement.classList.add('motion-observed');
  document.querySelectorAll('[data-photo], [data-calendar]').forEach((element) => photoObserver.observe(element));
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('is-visible');
      observer.unobserve(target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    element.classList.add('will-reveal');
    observer.observe(element);
  });
}

const music = document.querySelector('#wedding-music');
const musicButton = document.querySelector('[data-music-control]');
const musicStatus = document.querySelector('[data-music-status]');

if (music && musicButton) {
  music.volume = Number(music.dataset.volume);
  musicButton.hidden = false;
  let starting = false;

  const syncMusicButton = () => {
    const playing = !music.paused && !music.ended;
    const label = playing ? '暂停音乐 / Pause music' : '播放音乐 / Play music';
    musicButton.classList.toggle('is-playing', playing);
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', label);
    musicButton.title = label;
  };

  musicButton.addEventListener('click', async () => {
    if (starting) return;
    if (!music.paused) {
      music.pause();
      return;
    }
    starting = true;
    musicButton.setAttribute('aria-busy', 'true');
    musicStatus.textContent = '';
    try {
      if (music.error) music.load();
      await music.play();
    } catch {
      musicStatus.textContent = '音乐暂时无法播放，请再点一次重试。 / Unable to play music. Tap to retry.';
      musicButton.title = '重试播放 / Retry music';
    } finally {
      starting = false;
      musicButton.removeAttribute('aria-busy');
      syncMusicButton();
    }
  });

  ['playing', 'pause', 'ended'].forEach((event) => music.addEventListener(event, syncMusicButton));
  music.addEventListener('error', () => {
    musicStatus.textContent = '音乐暂时无法加载，请稍后重试。 / Unable to load music. Please try again.';
    syncMusicButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.pause();
  });
  window.addEventListener('pagehide', () => music.pause());
}
