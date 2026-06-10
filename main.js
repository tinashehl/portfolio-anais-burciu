/* ============================================================
   ANAÏS BURCIU — ARCHITECTURE PORTFOLIO
   main.js — Vanilla JS, no dependencies
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     THEME MANAGER
     Respects OS preference; persists manual override
  ---------------------------------------------------------- */
  const ThemeManager = {
    key: 'ab-theme',

    init() {
      const saved = localStorage.getItem(this.key);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.apply(theme, false);

      document.querySelector('.theme-toggle')?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        this.apply(current === 'dark' ? 'light' : 'dark');
      });

      // Sync across tabs
      window.addEventListener('storage', (e) => {
        if (e.key === this.key && e.newValue) this.apply(e.newValue, false);
      });
    },

    apply(theme, persist = true) {
      document.documentElement.setAttribute('data-theme', theme);
      if (persist) localStorage.setItem(this.key, theme);
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  };

  /* ----------------------------------------------------------
     CUSTOM CURSOR — desktop only
  ---------------------------------------------------------- */
  const Cursor = {
    el: null,
    ring: null,
    mouse: { x: -100, y: -100 },
    dotPos:  { x: -100, y: -100 },
    ringPos: { x: -100, y: -100 },
    raf: null,

    init() {
      this.el   = document.querySelector('.cursor');
      this.ring = document.querySelector('.cursor-ring');
      if (!this.el || !this.ring) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;

      document.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      document.addEventListener('mouseleave', () => {
        this.el.style.opacity = '0';
        this.ring.style.opacity = '0';
      });
      document.addEventListener('mouseenter', () => {
        this.el.style.opacity = '1';
        this.ring.style.opacity = '';
      });

      const hoverEls = document.querySelectorAll('a, button, [data-hover], .gallery-item, .project-card');
      hoverEls.forEach(el => {
        el.addEventListener('mouseenter', () => this.setHover(true));
        el.addEventListener('mouseleave', () => this.setHover(false));
      });

      this.loop();
    },

    setHover(state) {
      this.el.classList.toggle('is-hovering', state);
      this.ring.classList.toggle('is-hovering', state);
    },

    loop() {
      // Dot: near-instant
      this.dotPos.x += (this.mouse.x - this.dotPos.x) * 0.88;
      this.dotPos.y += (this.mouse.y - this.dotPos.y) * 0.88;
      // Ring: lags behind
      this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.11;
      this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.11;

      this.el.style.transform   = `translate(${this.dotPos.x}px, ${this.dotPos.y}px) translate(-50%,-50%)`;
      this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px) translate(-50%,-50%)`;

      this.raf = requestAnimationFrame(() => this.loop());
    }
  };

  /* ----------------------------------------------------------
     PAGE LOADER
  ---------------------------------------------------------- */
  const Loader = {
    init() {
      const loader = document.querySelector('.page-loader');
      if (!loader) return;

      const done = () => loader.classList.add('loaded');

      if (document.readyState === 'complete') {
        setTimeout(done, 400);
      } else {
        window.addEventListener('load', () => setTimeout(done, 400));
      }
    }
  };

  /* ----------------------------------------------------------
     NAVIGATION
  ---------------------------------------------------------- */
  const Nav = {
    nav: null,
    burger: null,
    mobileNav: null,
    isOpen: false,

    init() {
      this.nav       = document.querySelector('.nav');
      this.burger    = document.querySelector('.nav__hamburger');
      this.mobileNav = document.querySelector('.nav__mobile');
      if (!this.nav) return;

      // Scroll class
      window.addEventListener('scroll', () => {
        this.nav.classList.toggle('is-scrolled', window.scrollY > 40);
      }, { passive: true });

      // Mark active link
      const page = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
      this.nav.querySelectorAll('.nav__link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (page === '' && href === 'index.html')) {
          link.classList.add('is-active');
        }
      });

      // Hamburger
      this.burger?.addEventListener('click', () => this.toggleMobile());

      // Close on mobile link click
      this.mobileNav?.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => this.closeMobile());
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.closeMobile();
      });
    },

    toggleMobile() {
      this.isOpen ? this.closeMobile() : this.openMobile();
    },

    openMobile() {
      this.isOpen = true;
      this.burger?.classList.add('is-open');
      this.mobileNav?.classList.add('is-open');
      this.mobileNav?.removeAttribute('aria-hidden');
      this.burger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    },

    closeMobile() {
      this.isOpen = false;
      this.burger?.classList.remove('is-open');
      this.mobileNav?.classList.remove('is-open');
      this.mobileNav?.setAttribute('aria-hidden', 'true');
      this.burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  };

  /* ----------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver
  ---------------------------------------------------------- */
  const Reveal = {
    init() {
      const els = document.querySelectorAll('.reveal');
      if (!els.length) return;

      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

      els.forEach(el => obs.observe(el));
    }
  };

  /* ----------------------------------------------------------
     PROJECT FILTER
  ---------------------------------------------------------- */
  const Filter = {
    init() {
      const btns  = document.querySelectorAll('.filter-btn');
      const cards = document.querySelectorAll('[data-category]');
      if (!btns.length) return;

      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          const filter = btn.dataset.filter;

          cards.forEach(card => {
            const match = filter === 'all' || card.dataset.category === filter;
            if (match) {
              card.classList.remove('is-hidden');
              card.style.display = '';
            } else {
              card.classList.add('is-hidden');
              // Remove from layout after transition
              setTimeout(() => {
                if (card.classList.contains('is-hidden')) card.style.display = 'none';
              }, 350);
            }
          });
        });
      });
    }
  };

  /* ----------------------------------------------------------
     LAZY IMAGE LOADING
  ---------------------------------------------------------- */
  const Lazy = {
    init() {
      const imgs = document.querySelectorAll('img[data-src]');
      if (!imgs.length) return;

      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const img = e.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        });
      }, { rootMargin: '300px' });

      imgs.forEach(img => obs.observe(img));
    }
  };

  /* ----------------------------------------------------------
     CONTACT FORM — simulated submit
  ---------------------------------------------------------- */
  const ContactForm = {
    init() {
      const form = document.querySelector('.contact-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.form-submit');
        const html = btn.innerHTML;
        btn.textContent = 'Sending…';
        btn.disabled = true;

        setTimeout(() => {
          btn.textContent = 'Message Sent ✓';
          btn.style.cssText = 'background:var(--accent);border-color:var(--accent);color:#fff;cursor:default';
          form.reset();

          setTimeout(() => {
            btn.innerHTML = html;
            btn.disabled = false;
            btn.style.cssText = '';
          }, 4000);
        }, 1800);
      });
    }
  };

  /* ----------------------------------------------------------
     LIGHTBOX
  ---------------------------------------------------------- */
  const Lightbox = {
    el: null,
    imgs: [],
    idx: 0,

    init() {
      const items = document.querySelectorAll('.gallery-item[data-lightbox]');
      if (!items.length) return;

      this.imgs = Array.from(items).map(item => ({
        src: item.dataset.lightbox,
        alt: item.querySelector('img')?.alt || ''
      }));

      // Build DOM
      this.el = document.createElement('div');
      this.el.className = 'lightbox';
      this.el.setAttribute('role', 'dialog');
      this.el.setAttribute('aria-modal', 'true');
      this.el.setAttribute('aria-label', 'Image lightbox');
      this.el.innerHTML = `
        <div class="lightbox__backdrop"></div>
        <div class="lightbox__img-wrap">
          <img class="lightbox__img" src="" alt="">
        </div>
        <button class="lightbox__close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="lightbox__prev" aria-label="Previous image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <button class="lightbox__next" aria-label="Next image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <polyline points="9,6 15,12 9,18"/>
          </svg>
        </button>
      `;
      document.body.appendChild(this.el);

      // Events
      items.forEach((item, i) => {
        item.style.cursor = 'zoom-in';
        item.addEventListener('click', () => this.open(i));
      });

      this.el.querySelector('.lightbox__backdrop').addEventListener('click', () => this.close());
      this.el.querySelector('.lightbox__close').addEventListener('click', () => this.close());
      this.el.querySelector('.lightbox__prev').addEventListener('click', () => this.move(-1));
      this.el.querySelector('.lightbox__next').addEventListener('click', () => this.move(1));

      document.addEventListener('keydown', (e) => {
        if (!this.el.classList.contains('is-open')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.move(-1);
        if (e.key === 'ArrowRight') this.move(1);
      });
    },

    open(idx) {
      this.idx = idx;
      this.show();
      this.el.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.el.classList.remove('is-open');
      document.body.style.overflow = '';
    },

    move(dir) {
      this.idx = (this.idx + dir + this.imgs.length) % this.imgs.length;
      this.show();
    },

    show() {
      const img = this.el.querySelector('.lightbox__img');
      img.style.opacity = '0';
      img.src = this.imgs[this.idx].src;
      img.alt = this.imgs[this.idx].alt;
      img.onload = () => { img.style.opacity = '1'; };
    }
  };

  /* ----------------------------------------------------------
     SMOOTH ANCHOR SCROLL
  ---------------------------------------------------------- */
  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
          const href = a.getAttribute('href');
          if (href === '#') return;
          const target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        });
      });
    }
  };

  /* ----------------------------------------------------------
     HERO PARALLAX (subtle — only on desktop)
  ---------------------------------------------------------- */
  const Parallax = {
    init() {
      const bg = document.querySelector('.hero__bg');
      if (!bg) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;

      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        bg.style.transform = `translateY(${y * 0.28}px)`;
      }, { passive: true });
    }
  };

  /* ----------------------------------------------------------
     BOOT
  ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    Loader.init();
    Nav.init();
    Cursor.init();
    Reveal.init();
    Filter.init();
    Lazy.init();
    ContactForm.init();
    Lightbox.init();
    SmoothScroll.init();
    Parallax.init();
  });

})();
