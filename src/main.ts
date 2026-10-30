/**
 * লড়িবাগ মধ্যপাড়া নূরানী হাফিজিয়া মাদ্রাসা — site interactions
 * TypeScript, no runtime dependencies. Bundled by esbuild, inlined into index.html.
 */

type PaletteName = 'emerald' | 'midnight' | 'sand' | 'jade' | 'maroon';

const PALETTES: readonly PaletteName[] = ['emerald', 'midnight', 'sand', 'jade', 'maroon'];
const PALETTE_KEY = 'madrasa-palette';

/* ------------------------------ helpers ------------------------------ */

const $ = <T extends Element = HTMLElement>(sel: string): T | null =>
  document.querySelector<T>(sel);

const $$ = <T extends Element = HTMLElement>(sel: string): T[] =>
  Array.from(document.querySelectorAll<T>(sel));

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isPaletteName = (value: string | null): value is PaletteName =>
  value !== null && (PALETTES as readonly string[]).includes(value);

const readStoredPalette = (): PaletteName | null => {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    return isPaletteName(stored) ? stored : null;
  } catch {
    return null;
  }
};

const storePalette = (name: PaletteName): void => {
  try {
    localStorage.setItem(PALETTE_KEY, name);
  } catch {
    /* storage may be blocked — palette still applies for this session */
  }
};

/* ------------------------------- drawer ------------------------------ */

const initDrawer = (): void => {
  const button = $<HTMLButtonElement>('#menuBtn');
  const drawer = $('#drawer');
  if (!button || !drawer) return;

  const setNav = (open: boolean): void => {
    document.body.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  button.addEventListener('click', () => {
    setNav(!document.body.classList.contains('nav-open'));
  });

  drawer.addEventListener('click', (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) setNav(false);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setNav(false);
  });
};

/* ------------------------------ palette ------------------------------ */

const initPalette = (): void => {
  const root = document.documentElement;
  const buttons = $$<HTMLButtonElement>('.swatch');

  const applyPalette = (name: PaletteName, persist: boolean): void => {
    root.setAttribute('data-palette', name);
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.palette === name));
    });
    if (persist) storePalette(name);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.palette;
      if (isPaletteName(name ?? null)) applyPalette(name as PaletteName, true);
    });
  });

  const stored = readStoredPalette();
  if (stored) applyPalette(stored, false);
};

/* ------------------------------- stats ------------------------------- */

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

const toBengaliDigits = (value: number): string =>
  String(value)
    .split('')
    .map((char) => BN_DIGITS[Number(char)] ?? char)
    .join('');

const formatStat = (value: number, withPlus: boolean): string =>
  toBengaliDigits(value) + (withPlus ? '<span class="plus">+</span>' : '');

const initStats = (): void => {
  const numbers = $$<HTMLElement>('.stat__num');
  if (numbers.length === 0) return;

  const animate = (el: HTMLElement): void => {
    const target = Number.parseInt(el.dataset.count ?? '0', 10) || 0;
    const withPlus = el.dataset.plus === '1';

    if (prefersReducedMotion()) {
      el.innerHTML = formatStat(target, withPlus);
      return;
    }

    const duration = 1200;
    let start: number | null = null;

    const step = (now: number): void => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.innerHTML = formatStat(Math.round(target * eased), withPlus);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  let started = false;
  const run = (): void => {
    if (started) return;
    started = true;
    numbers.forEach(animate);
  };

  const section = $('.stats');
  if ('IntersectionObserver' in window && section) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run(); // numbers count up
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(section);
  } else {
    run();
  }
};

/* ------------------------------- splash ------------------------------ */

const SPLASH_KEY = 'madrasa-splash-shown';

const initSplash = (): void => {
  const splash = $<HTMLElement>('#splash');
  if (!splash) return;

  let seen = false;
  try {
    seen = sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    seen = false;
  }

  const finish = (): void => {
    splash.classList.add('is-done');
    splash.setAttribute('aria-hidden', 'true');
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      /* private mode — the intro simply plays again next time */
    }
    window.setTimeout(() => splash.remove(), 900);
    document.dispatchEvent(new CustomEvent('intro:done'));
  };

  // reduced motion or a repeat visit in this session → skip straight away
  if (seen || prefersReducedMotion()) {
    window.setTimeout(finish, prefersReducedMotion() ? 350 : 120);
    return;
  }

  // total intro ≈ 1.75s: matches the CSS progress bar
  const minShow = 1750;
  const start = performance.now();
  const close = (): void => {
    const left = Math.max(0, minShow - (performance.now() - start));
    window.setTimeout(finish, left);
  };

  if (document.readyState === 'complete') close();
  else window.addEventListener('load', close, { once: true });

  // hard safety net — never trap the visitor behind an intro
  window.setTimeout(() => {
    if (!splash.classList.contains('is-done')) finish();
  }, 4200);
};

/* ------------------------- progressive enhancement ------------------- */

/** Marks the document as scripted, so CSS can hide-then-animate safely. */
const markScripted = (): void => {
  document.documentElement.classList.add('js');
};

/* ------------------------------- gallery ----------------------------- */

const initGallery = (): void => {
  const grid = $<HTMLElement>('#galleryGrid');
  const lightbox = $<HTMLElement>('#lightbox');
  if (!grid) return;

  const allTiles = Array.from(grid.querySelectorAll<HTMLElement>('.tile'));
  const filters = $$<HTMLButtonElement>('.filter');

  /* ---- filtering ---- */
  const applyFilter = (value: string): void => {
    filters.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === value));
    });
    allTiles.forEach((tile) => {
      const match = value === 'all' || tile.dataset.cat === value;
      tile.classList.toggle('is-hidden', !match);
    });
  };

  filters.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter ?? 'all'));
  });

  if (!lightbox) return;

  /* ---- lightbox ---- */
  const titleEl = $<HTMLElement>('#lbTitle');
  const subEl = $<HTMLElement>('#lbSub');
  let current = -1;
  let lastFocused: HTMLElement | null = null;

  const visibleTiles = (): HTMLElement[] =>
    allTiles.filter((tile) => !tile.classList.contains('is-hidden'));

  const render = (index: number): void => {
    const list = visibleTiles();
    if (list.length === 0) return;
    current = (index + list.length) % list.length;
    const tile = list[current];
    if (!tile) return;
    if (titleEl) titleEl.textContent = tile.dataset.title ?? '';
    if (subEl) subEl.textContent = tile.dataset.sub ?? '';
  };

  const open = (tile: HTMLElement): void => {
    lastFocused = tile;
    render(visibleTiles().indexOf(tile));
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    $<HTMLButtonElement>('.lightbox__close')?.focus();
  };

  const close = (): void => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      lightbox.hidden = true;
    }, 300);
    lastFocused?.focus();
  };

  allTiles.forEach((tile) => {
    tile.addEventListener('click', () => open(tile));
    tile.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(tile);
      }
    });
  });

  lightbox.addEventListener('click', (event: MouseEvent) => {
    const action = (event.target as Element).closest<HTMLElement>('[data-lb]')?.dataset.lb;
    if (action === 'close' || event.target === lightbox) close();
    if (action === 'prev') render(current - 1);
    if (action === 'next') render(current + 1);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') render(current - 1);
    if (event.key === 'ArrowRight') render(current + 1);
  });

  // simple swipe on touch devices
  let startX = 0;
  lightbox.addEventListener('touchstart', (event: TouchEvent) => {
    startX = event.touches[0]?.clientX ?? 0;
  }, { passive: true });
  lightbox.addEventListener('touchend', (event: TouchEvent) => {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const dx = endX - startX;
    if (Math.abs(dx) > 48) render(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
};

/* ------------------------------- donate ------------------------------ */

const initDonate = (): void => {
  const toast = $<HTMLElement>('#donateToast');
  let toastTimer = 0;

  const showToast = (message: string): void => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
  };

  const copyText = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(field);
        return ok;
      } catch {
        return false;
      }
    }
  };

  $$<HTMLButtonElement>('.pay__copy').forEach((button) => {
    const row = button.closest('.pay__row');
    const numEl = row?.querySelector<HTMLElement>('.pay__num');
    if (numEl) {
      numEl.style.cursor = 'pointer';
      numEl.title = 'কপি করতে চাপ দিন';
      numEl.addEventListener('click', () => button.click());
    }

    button.addEventListener('click', async () => {
      const value = button.dataset.copy ?? '';
      const label = button.dataset.label ?? 'নম্বর';
      const ok = await copyText(value);
      const textEl = button.querySelector<HTMLElement>('.pay__copyText');
      if (ok) {
        button.classList.add('is-copied');
        if (textEl) textEl.textContent = 'কপি হয়েছে';
        showToast(`${label} নম্বর কপি হয়েছে`);
        window.setTimeout(() => {
          button.classList.remove('is-copied');
          if (textEl) textEl.textContent = 'কপি';
        }, 2000);
      } else {
        showToast('কপি করা যায়নি — নম্বরটি হাতে লিখে নিন');
      }
    });
  });
};

/* ------------------------------ teachers ----------------------------- */

const initTeachers = (): void => {
  const track = $<HTMLElement>('[data-track]');
  if (!track) return;

  const prev = $<HTMLButtonElement>('[data-track-prev]');
  const next = $<HTMLButtonElement>('[data-track-next]');

  const step = (): number => {
    const card = track.querySelector<HTMLElement>('.teacher');
    if (!card) return track.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const sync = (): void => {
    const max = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft >= max - 2;
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
    track.classList.toggle('is-scrollable', max > 4);
    track.classList.toggle('at-start', atStart);
    track.classList.toggle('at-end', atEnd);
  };

  const scrollByStep = (dir: number): void => {
    const smooth = !prefersReducedMotion();
    track.scrollBy({ left: dir * step(), behavior: smooth ? 'smooth' : 'auto' });
  };

  prev?.addEventListener('click', () => scrollByStep(-1));
  next?.addEventListener('click', () => scrollByStep(1));

  track.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); scrollByStep(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); scrollByStep(-1); }
  });

  // vertical wheel over the track scrolls the page, unless it is a real trackpad swipe
  track.addEventListener('wheel', (event: WheelEvent) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    track.scrollLeft += event.deltaX;
  }, { passive: false });

  let raf = 0;
  const onScroll = (): void => {
    window.cancelAnimationFrame(raf);
    raf = window.requestAnimationFrame(sync);
  };
  track.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  sync();
};

/* ------------------------------ typewriter ---------------------------- */

type SegmenterLike = { segment: (input: string) => Iterable<{ segment: string }> };

const splitGraphemes = (text: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => SegmenterLike })
    .Segmenter;
  if (typeof Seg === 'function') {
    const seg = new Seg('ar', { granularity: 'grapheme' });
    return Array.from(seg.segment(text), (part) => part.segment);
  }
  return Array.from(text);
};

const initBismillahType = (): void => {
  const wrap = $<HTMLElement>('.bismillah');
  const text = wrap?.querySelector<HTMLElement>('.bismillah__text');
  const ghost = wrap?.querySelector<HTMLElement>('.bismillah__ghost');
  if (!wrap || !text || !ghost) return;

  const full = ghost.textContent ?? '';
  const graphemes = splitGraphemes(full);
  const finish = (): void => {
    text.textContent = full;
    wrap.classList.remove('is-typing');
    wrap.classList.add('is-typed');
  };

  if (prefersReducedMotion() || graphemes.length === 0) {
    finish();
    return;
  }

  // start empty; whole glyphs are appended so Arabic joins/ligatures stay correct
  text.textContent = '';
  wrap.classList.add('is-typing');

  const step = Math.max(30, Math.min(64, 1500 / graphemes.length));
  let index = 0;
  let started = false;

  const tick = (): void => {
    index += 1;
    text.textContent = graphemes.slice(0, index).join('');
    if (index >= graphemes.length) {
      finish();
      return;
    }
    window.setTimeout(tick, graphemes[index] === ' ' ? step * 1.7 : step);
  };

  const begin = (): void => {
    if (started) return;
    started = true;
    window.setTimeout(tick, 240);
  };

  // start once the splash has cleared, with a safety net in case it never fires
  document.addEventListener('intro:done', begin, { once: true });
  window.setTimeout(begin, 3200);
};

/* ------------------------------- footer ------------------------------ */

const initFooter = (): void => {
  const year = $<HTMLElement>('#year');
  if (year) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    year.textContent = String(new Date().getFullYear())
      .split('')
      .map((digit) => bn[Number(digit)] ?? digit)
      .join('');
  }

  $<HTMLButtonElement>('.footer__top')?.addEventListener('click', () => {
    const smooth = !prefersReducedMotion();
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  });
};

/* -------------------------------- boot ------------------------------- */

markScripted();
initSplash();
initDrawer();
initPalette();
initStats();
initGallery();
initDonate();
initTeachers();
initBismillahType();
initFooter();
