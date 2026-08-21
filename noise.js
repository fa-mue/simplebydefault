/* Simple by Default — "Noise vs. Focus"
   1. Animated film grain on a canvas behind everything.
   2. The focus pull: blur snaps to zero, grain dissolves into the grid.
   3. A short mechatronic snap via Web Audio (no files), on the click.
   4. The slim contact widget opens a prefilled mail draft.
   No dependencies, no storage, no external requests. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Grain --------------------------------------------------------- */

  var canvas = document.getElementById('grain');
  var running = false;
  var rafId = null;
  var tickAt = 0;

  if (canvas && canvas.getContext) {
    var ctx2d = canvas.getContext('2d', { alpha: true });
    /* Noise is generated small and stretched, which is both cheaper and
       reads as coarser film grain. */
    var nw = 220, nh = 124;
    var buf = document.createElement('canvas');
    buf.width = nw;
    buf.height = nh;
    var bctx = buf.getContext('2d', { alpha: true });
    var img = bctx.createImageData(nw, nh);

    var sizeCanvas = function () {
      canvas.width = Math.max(1, Math.floor(window.innerWidth));
      canvas.height = Math.max(1, Math.floor(window.innerHeight));
      ctx2d.imageSmoothingEnabled = true;
    };

    var paint = function () {
      var d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 26; /* faint */
      }
      bctx.putImageData(img, 0, 0);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.drawImage(buf, 0, 0, canvas.width, canvas.height);
    };

    var loop = function (t) {
      if (!running) return;
      /* ~24fps is plenty for grain and keeps the CPU quiet. */
      if (t - tickAt > 42) {
        paint();
        tickAt = t;
      }
      rafId = window.requestAnimationFrame(loop);
    };

    var start = function () {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(loop);
    };
    var stop = function () {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    };

    sizeCanvas();
    paint();
    window.addEventListener('resize', function () {
      sizeCanvas();
      if (!running) paint();
    });

    if (reduce) {
      /* One static frame, no animation. */
    } else {
      start();
    }

    /* Pause the grain when it is invisible (sharp state). */
    window.__grain = { start: start, stop: stop, reduce: reduce };
  }

  /* ---- 3. Snap sound ---------------------------------------------------- */

  var audio = null;
  function snap() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime;

      /* Low thock: a quick pitch drop. */
      var o = audio.createOscillator();
      var g = audio.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(240, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.06);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.09);

      /* High tick: the mechanical edge. */
      var o2 = audio.createOscillator();
      var g2 = audio.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(1500, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.05, t + 0.002);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      o2.connect(g2).connect(audio.destination);
      o2.start(t);
      o2.stop(t + 0.04);
    } catch (e) {
      /* Sound is a nicety; never let it break the interaction. */
    }
  }

  /* ---- 1b. The clutter fills up ----------------------------------------
     Notifications are not there at once. They pop in one after another, so
     the screen visibly gets fuller the longer you wait. */

  var pops = [];
  var popTimer = null;
  var popIndex = 0;

  function stopPops() {
    if (popTimer) {
      window.clearInterval(popTimer);
      popTimer = null;
    }
  }

  function clearPops() {
    stopPops();
    popIndex = 0;
    for (var i = 0; i < pops.length; i++) pops[i].classList.remove('in');
  }

  function startPops() {
    if (!pops.length) return;
    clearPops();

    if (reduce) {
      /* No staged animation for reduced motion: show the clutter at once. */
      for (var i = 0; i < pops.length; i++) pops[i].classList.add('in');
      return;
    }

    /* First two land quickly, then one every ~420ms until the screen is full. */
    pops[popIndex++].classList.add('in');
    popTimer = window.setInterval(function () {
      if (popIndex >= pops.length) {
        stopPops();
        return;
      }
      pops[popIndex++].classList.add('in');
    }, 420);
  }

  /* ---- 2. State: noise <-> sharp --------------------------------------- */

  var swapTimer = null;

  function toSharp(withSound) {
    if (swapTimer) window.clearTimeout(swapTimer);
    if (withSound) snap();
    stopPops();

    if (reduce) {
      root.setAttribute('data-state', 'sharp');
      if (window.__grain) window.__grain.stop();
      return;
    }

    /* The focus pull: de-blur first, then resolve into the page. */
    root.classList.add('sharpening');
    swapTimer = window.setTimeout(function () {
      root.setAttribute('data-state', 'sharp');
      root.classList.remove('sharpening');
      if (window.__grain) window.__grain.stop();
    }, 300);
  }

  function toNoise() {
    if (swapTimer) window.clearTimeout(swapTimer);
    root.classList.remove('sharpening');
    root.setAttribute('data-state', 'noise');
    if (window.__grain && !window.__grain.reduce) window.__grain.start();
    /* The clutter builds up again from scratch. */
    startPops();
    var focus = document.querySelector('.sharpen');
    if (focus) focus.focus({ preventScroll: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    pops = Array.prototype.slice.call(document.querySelectorAll('.pop'));
    startPops();

    var sharpenBtns = document.querySelectorAll('[data-sharpen]');
    for (var i = 0; i < sharpenBtns.length; i++) {
      sharpenBtns[i].addEventListener('click', function () {
        toSharp(true);
      });
    }

    var noiseBtns = document.querySelectorAll('[data-noise]');
    for (var j = 0; j < noiseBtns.length; j++) {
      noiseBtns[j].addEventListener('click', function () {
        toNoise();
      });
    }

    /* ---- 4. Contact widget: open a prefilled mail draft ---------------- */
    var form = document.querySelector('[data-contact]');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var from = input && input.value ? input.value.trim() : '';
        var subject = 'Project inquiry via simplebydefault.com';
        var body =
          'Hi Simple by Default,\n\nI would like to talk about a project.\n\n' +
          (from ? 'My email: ' + from + '\n' : '');
        window.location.href =
          'mailto:hello@simplebydefault.com?subject=' +
          encodeURIComponent(subject) +
          '&body=' +
          encodeURIComponent(body);
      });
    }
  });
})();
