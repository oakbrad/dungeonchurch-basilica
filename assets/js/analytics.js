// Dungeon Church analytics layer.
//
// Server-rendered member tier and post context are read from data attributes
// (default.hbs sets data-member-status on <body>; post templates set
// data-post-slug / data-post-visibility on their <article>). Every event is
// augmented with that context and handed to Umami.
//
// Member identity is tier-only: no email or member UUID is ever read or sent.
//
// Bundled into assets/built/casper.js by the gulp `js` task. ES2018 syntax
// only (gulp-uglify/uglify-js cannot parse optional chaining or nullish
// coalescing).

(function (window, document) {
    'use strict';

    var MAX_PROP_LENGTH = 200;

    function memberStatus() {
        var b = document.body;
        return (b && b.getAttribute('data-member-status')) || 'unknown';
    }

    function truncate(value) {
        return String(value).slice(0, MAX_PROP_LENGTH);
    }

    // Public entry point. No-ops when Umami is unavailable (local dev, adblock,
    // script failure), so every caller can stay unguarded-by-feature.
    window.dcTrack = function (name, data) {
        if (!window.umami || typeof window.umami.track !== 'function') {
            return;
        }
        data = data || {};
        data.member_status = data.member_status || memberStatus();
        var art = document.querySelector('article.article[data-post-slug]');
        if (art) {
            data.post_slug = data.post_slug || art.getAttribute('data-post-slug');
            data.post_visibility = data.post_visibility || art.getAttribute('data-post-visibility');
        }
        for (var k in data) {
            if (typeof data[k] === 'string') {
                data[k] = truncate(data[k]);
            }
        }
        try {
            window.umami.track(String(name).slice(0, 50), data);
        } catch (e) { /* never let tracking break the page */ }
    };

    /* ------------------------------------------------------------------ *
     * Delegated click events
     * ------------------------------------------------------------------ */

    var DOWNLOAD_EXT = /\.(zip|png|jpe?g|pdf|json|mp3|wav|ogg|webm)$/i;

    function isExternal(a) {
        return !!a.hostname && a.hostname !== window.location.hostname;
    }

    function portalIntent(el) {
        var declared = el.getAttribute('data-portal');
        if (declared) {
            return declared;
        }
        var href = el.getAttribute('href') || '';
        if (href.indexOf('account/plans') !== -1) { return 'upgrade'; }
        if (href.indexOf('signup') !== -1) { return 'signup'; }
        if (href.indexOf('signin') !== -1) { return 'signin'; }
        if (href.indexOf('account') !== -1) { return 'account'; }
        return 'portal';
    }

    function portalSource(el) {
        if (el.closest('.footer-cta')) { return 'post-footer-cta'; }
        if (el.closest('.map-access-message')) { return 'map-gate'; }
        if (el.closest('.timeline-access-message')) { return 'timeline-gate'; }
        if (el.closest('.post-card-access')) { return 'card-gate'; }
        if (el.closest('.gh-head-members, .gh-head-actions')) { return 'header'; }
        return 'body';
    }

    function npcName(card) {
        var heading = card.querySelector('h2');
        return heading ? heading.textContent.trim() : '';
    }

    // Bestiary/NPC/gallery/lightbox triggers live in post content; the delegated
    // listener resolves the closest matching target per rule, first match wins.
    function onClick(e) {
        var target = e.target;
        if (!target || !target.closest) { return; }

        // 1. Portal funnel
        var portalEl = target.closest('[data-portal], a[href^="#/portal"]');
        if (portalEl) {
            window.dcTrack('portal-cta-click', {
                intent: portalIntent(portalEl),
                source: portalSource(portalEl)
            });
            return;
        }

        // 2. Downloads (anchor download attr, or an asset extension)
        var downloadEl = target.closest('a[download]');
        if (!downloadEl) {
            var candidate = target.closest('a[href]');
            if (candidate && DOWNLOAD_EXT.test(candidate.pathname)) {
                downloadEl = candidate;
            }
        }
        if (downloadEl) {
            var segments = downloadEl.pathname.split('/');
            window.dcTrack('download-click', {
                filename: downloadEl.getAttribute('download') || segments[segments.length - 1] || ''
            });
            return;
        }

        // 3. NPC card image toggle
        var npcToggle = target.closest('.npc-image-toggle');
        if (npcToggle) {
            var npcCard = npcToggle.closest('.npc-card');
            window.dcTrack('npc-image-toggle', {npc: npcCard ? npcName(npcCard) : ''});
            return;
        }

        // 4/5. Outbound links (NPC wiki/artwork links get their NPC name attached)
        var link = target.closest('a[href^="http"]');
        if (link && isExternal(link)) {
            var linkedCard = link.closest('.npc-card');
            if (linkedCard) {
                window.dcTrack('npc-outbound-click', {
                    npc: npcName(linkedCard),
                    domain: link.hostname
                });
            } else {
                window.dcTrack('outbound-click', {
                    domain: link.hostname,
                    path: String(link.pathname || '').slice(0, 100)
                });
            }
            return;
        }

        // 6. Ghost search overlay
        if (target.closest('[data-ghost-search]')) {
            window.dcTrack('search-open');
            return;
        }

        // 7. Mobile menu (state is toggled by an element-level listener that
        //    fires before this delegated one; defer a tick to read it)
        if (target.closest('.gh-burger')) {
            window.setTimeout(function () {
                var open = document.body.classList.contains('gh-head-open');
                window.dcTrack('menu-toggle', {state: open ? 'opened' : 'closed'});
            }, 0);
            return;
        }

        // 8. Lightbox (mirrors the exact trigger selector bound in lightbox.js)
        var lightboxTrigger = target.closest('.kg-image-card > .kg-image[width][height], .kg-gallery-image > img');
        if (lightboxTrigger) {
            window.dcTrack('lightbox-open', {
                alt: lightboxTrigger.getAttribute('alt') || '',
                gallery: lightboxTrigger.closest('.kg-gallery-card') ? 'true' : 'false'
            });
            return;
        }

        // 9. Bestiary column sort
        var sortHeader = target.closest('.bestiary-table th.sortable');
        if (sortHeader) {
            window.dcTrack('bestiary-sort', {
                column: sortHeader.getAttribute('data-sort') || ''
            });
        }
    }

    function initClicks() {
        // Capture phase: several theme scripts call stopPropagation() on their
        // own handlers (e.g. npc-grid.js's image toggle), which would hide the
        // click from a bubble-phase delegate.
        document.addEventListener('click', onClick, true);
    }

    /* ------------------------------------------------------------------ *
     * Roll results (fire on landing, so the rolled value is captured and
     * rolls that produce no result are excluded)
     * ------------------------------------------------------------------ */

    // The table roller writes "Loading table..." / "Rolling..." into the result
    // div; only displayResult() marks a real landing with `result-fade-in`, so
    // that class is the signal rather than the text.
    function initTableRollObservers() {
        if (typeof window.MutationObserver !== 'function') { return; }
        var containers = document.querySelectorAll('.table-roller-container');
        Array.prototype.forEach.call(containers, function (container) {
            var result = container.querySelector('.table-roller-result');
            if (!result) { return; }
            var observer = new MutationObserver(function () {
                // Records are read after the fact; inspect live state instead of
                // walking records so a remove+add pair fires exactly once.
                if (!result.classList.contains('result-fade-in')) { return; }
                // displayResult writes the rolled value plus an optional
                // `.table-roller-description` sibling; keep only the value so
                // the two are not concatenated into one string.
                var value = result.cloneNode(true);
                var description = value.querySelector('.table-roller-description');
                if (description) { description.parentNode.removeChild(description); }
                var text = (value.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text) { return; }
                window.dcTrack('roll-table', {
                    table: container.getAttribute('data-5e-table') || 'inline',
                    result: text
                });
            });
            observer.observe(result, {attributes: true, attributeFilter: ['class']});
        });
    }

    // npc-roller.js highlights the picked card; the highlight landing is the
    // signal, not the click (a roll with no NPC data returns early). One roll
    // rewrites several class attributes across the batch, so coalesce the burst
    // and resolve the rolled card from live state.
    function initNpcRollObservers() {
        if (typeof window.MutationObserver !== 'function') { return; }
        var grid = document.querySelector('.npc-grid-container');
        if (!grid) { return; }
        var timer = null;
        var observer = new MutationObserver(function (records) {
            var touched = false;
            records.forEach(function (record) {
                var el = record.target;
                if (el.classList && el.classList.contains('npc-card-highlighted')) { touched = true; }
            });
            if (!touched) { return; }
            if (timer) { window.clearTimeout(timer); }
            timer = window.setTimeout(function () {
                timer = null;
                var highlighted = grid.querySelector('.npc-card-highlighted');
                if (!highlighted) { return; }
                window.dcTrack('roll-npc', {npc: npcName(highlighted)});
            }, 100);
        });
        observer.observe(grid, {attributes: true, attributeFilter: ['class'], subtree: true});
    }

    // pyoran-roller.js marks each slot `.result-ready` as it fills; fire once
    // every slot is ready (the animation settles slot-by-slot).
    function initPyoranRollObservers() {
        if (typeof window.MutationObserver !== 'function') { return; }
        var containers = document.querySelectorAll('.pyoran-results');
        Array.prototype.forEach.call(containers, function (container) {
            var timer = null;
            var observer = new MutationObserver(function () {
                if (timer) { window.clearTimeout(timer); }
                timer = window.setTimeout(function () {
                    var slots = container.querySelectorAll('[data-result]');
                    if (!slots.length) { return; }
                    var data = {};
                    var allReady = true;
                    Array.prototype.forEach.call(slots, function (slot) {
                        var value = slot.querySelector('.pyoran-result-value');
                        if (!value || !value.classList.contains('result-ready')) {
                            allReady = false;
                            return;
                        }
                        data[slot.getAttribute('data-result').toLowerCase()] = (value.textContent || '').trim();
                    });
                    if (!allReady) { return; }
                    window.dcTrack('roll-pyoran', data);
                }, 300);
            });
            observer.observe(container, {
                childList: true,
                characterData: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    function initRollObservers() {
        initTableRollObservers();
        initNpcRollObservers();
        initPyoranRollObservers();
    }

    /* ------------------------------------------------------------------ *
     * Gate impressions
     * ------------------------------------------------------------------ */

    function initGates() {
        if (typeof window.IntersectionObserver !== 'function') { return; }
        var gates = document.querySelectorAll('.map-access-message, .timeline-access-message, .post-card-access');
        if (!gates.length) { return; }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) { return; }
                var el = entry.target;
                if (el.getAttribute('data-dc-gate-viewed')) { return; }
                el.setAttribute('data-dc-gate-viewed', '1');
                observer.unobserve(el);
                var template = 'card';
                if (el.classList.contains('map-access-message')) {
                    template = 'map';
                } else if (el.classList.contains('timeline-access-message')) {
                    template = 'timeline';
                }
                window.dcTrack('gate-view', {
                    tier: el.getAttribute('data-gate-tier') || '',
                    template: template
                });
            });
        }, {threshold: 0.5});
        Array.prototype.forEach.call(gates, function (el) { observer.observe(el); });
    }

    /* ------------------------------------------------------------------ *
     * Read depth
     * ------------------------------------------------------------------ */

    function readDepthBucket(percentage) {
        if (percentage >= 100) { return 100; }
        if (percentage >= 75) { return 75; }
        if (percentage >= 50) { return 50; }
        if (percentage >= 25) { return 25; }
        return 0;
    }

    function initReadDepth() {
        var article = document.querySelector('article.article[data-post-slug]');
        if (!article) { return; }

        var loadTs = Date.now();
        var maxBucket = 0;
        var fired = false;
        var ticking = false;

        // Same geometry as partials/reading-progress.hbs so the buckets agree.
        function measure() {
            ticking = false;
            var articleTop = article.getBoundingClientRect().top + window.pageYOffset;
            var scrollableHeight = article.offsetHeight - window.innerHeight;
            var scrolledPast = window.pageYOffset - articleTop;
            var percentage = 0;
            if (scrollableHeight > 0) {
                percentage = Math.min(100, Math.max(0, (scrolledPast / scrollableHeight) * 100));
            }
            var bucket = readDepthBucket(percentage);
            if (bucket > maxBucket) { maxBucket = bucket; }
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(measure);
            }
        }, {passive: true});

        function flush() {
            if (fired) { return; }
            fired = true;
            measure();
            window.dcTrack('read-depth', {
                max_percent: String(maxBucket),
                seconds_on_page: String(Math.round((Date.now() - loadTs) / 1000))
            });
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { flush(); }
        });
        window.addEventListener('pagehide', flush);

        measure();
    }

    /* ------------------------------------------------------------------ *
     * Livestream banner (rendered dynamically by livestream-checker.js)
     * ------------------------------------------------------------------ */

    function initStreamUI() {
        document.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('#livestream-banner')) {
                window.dcTrack('livestream-banner-click');
            }
        });
    }

    /* ------------------------------------------------------------------ *
     * Boot
     * ------------------------------------------------------------------ */

    function boot() {
        // Session property. `identify(data)` (session data without an id) needs
        // Umami >= 2.13.0; feature-detected, and per-event member_status still
        // splits traffic on older trackers.
        if (window.umami && typeof window.umami.identify === 'function') {
            try {
                window.umami.identify({member_status: memberStatus()});
            } catch (e) { /* ignore */ }
        }
        initClicks();
        initGates();
        initRollObservers();
        initReadDepth();
        initStreamUI();
    }

    // casper.js is a classic script and runs before DOMContentLoaded, but the
    // Umami tag may be `defer`; booting on DOMContentLoaded lets `umami` exist.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window, document);
