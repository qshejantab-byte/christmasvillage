type Cine = {
  video: HTMLVideoElement;
  frame: HTMLElement;
  toggle: HTMLButtonElement | null;
  loaded: boolean;
  visible: boolean;
  userPaused: boolean;
};

let started = false;

export function initCinematicVideo() {
  if (started) return;
  started = true;

  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-cine]')];
  if (!videos.length) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const constrained = !!connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');
  if (reduceMotion.matches || constrained) return;

  const mobile = matchMedia('(max-width: 699px)').matches;
  const items: Cine[] = videos.map((video) => {
    const frame = video.closest<HTMLElement>('.media')!;
    return { video, frame, toggle: frame.querySelector('[data-cine-toggle]'), loaded: false, visible: false, userPaused: false };
  });

  const load = (item: Cine) => {
    if (item.loaded) return;
    const d = item.video.dataset;
    const sources: [string | undefined, string][] = mobile
      ? [[d.mobileWebm ?? d.webm, 'video/webm'], [d.mobileMp4 ?? d.mp4, 'video/mp4']]
      : [[d.webm, 'video/webm'], [d.mp4, 'video/mp4']];
    for (const [src, type] of sources) {
      if (!src) continue;
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      item.video.append(source);
    }
    item.video.preload = 'auto';
    item.video.load();
    item.loaded = true;
    item.video.addEventListener('playing', () => item.frame.classList.add('is-playing'));
    if (item.toggle) item.toggle.hidden = false;
  };

  const choose = () => {
    const candidates = items.filter((i) => i.visible && i.loaded && !i.userPaused);
    const active = candidates.sort(
      (a, b) => visibleArea(b.frame) - visibleArea(a.frame),
    )[0];
    for (const item of items) {
      if (item === active) item.video.play().catch(() => {});
      else if (!item.video.paused) item.video.pause();
    }
  };

  const nearObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && load(items.find((i) => i.frame === e.target)!)),
    { rootMargin: '50% 0px' },
  );
  const playObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const item = items.find((i) => i.frame === e.target);
        if (item) item.visible = e.isIntersecting;
      });
      choose();
    },
    { threshold: [0, 0.35, 0.7] },
  );

  for (const item of items) {
    if (item.video.dataset.priority === 'true') load(item);
    nearObserver.observe(item.frame);
    playObserver.observe(item.frame);
    item.video.addEventListener('canplay', choose, { once: true });
    item.toggle?.addEventListener('click', () => {
      item.userPaused = !item.userPaused;
      item.toggle!.setAttribute('aria-pressed', String(item.userPaused));
      item.toggle!.setAttribute('aria-label', item.userPaused ? 'Play background video' : 'Pause background video');
      if (item.userPaused) item.video.pause();
      choose();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach((i) => i.video.pause());
    else choose();
  });
}

function visibleArea(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  return h * w;
}
