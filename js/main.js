(function () {
  'use strict';

  var products = [];
  var filters = { type: 'all', style: 'all', price: 'all' };

  var grid = document.getElementById('grid');
  var counter = document.getElementById('counter');
  var modal = document.getElementById('modal');
  var form = document.getElementById('form');
  var success = document.getElementById('success');
  var textarea = form.querySelector('textarea[name="comment"]');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealObserver = ('IntersectionObserver' in window) && !reduceMotion
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 })
    : null;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatPrice(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function priceMatch(price, bucket) {
    if (bucket === 'all') return true;
    if (bucket === 'lt15') return price < 15000;
    if (bucket === '15-40') return price >= 15000 && price <= 40000;
    if (bucket === 'gt40') return price > 40000;
    return true;
  }

  function getVisible() {
    return products.filter(function (p) {
      return (filters.type === 'all' || p.type === filters.type) &&
             (filters.style === 'all' || p.style === filters.style) &&
             priceMatch(p.price, filters.price);
    });
  }

  function render() {
    var visible = getVisible();
    counter.textContent = 'Показано ' + visible.length + ' из ' + products.length;
    grid.innerHTML = '';

    if (visible.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'card__empty';
      empty.textContent = 'Ничего не найдено по выбранным фильтрам.';
      grid.appendChild(empty);
      return;
    }

    visible.forEach(function (p, i) {
      var num = pad(products.indexOf(p) + 1);
      var card = document.createElement('button');
      card.className = reduceMotion ? 'card' : 'card reveal';
      card.type = 'button';
      card.innerHTML =
        '<span class="card__media"><img src="' + p.img + '" alt="' + p.name + '"></span>' +
        '<span class="card__num">' + num + '</span>' +
        '<span class="card__name">' + p.name + '</span>' +
        '<span class="card__meta">' + p.type + ' · ' + p.style + '</span>' +
        '<span class="card__price">' + formatPrice(p.price) + '</span>';
      card.addEventListener('click', function () { openModal(p); });
      grid.appendChild(card);

      if (revealObserver) {
        card.style.transitionDelay = Math.min(i, 7) * 60 + 'ms';
        revealObserver.observe(card);
      }
    });
  }

  // Filters
  document.getElementById('filters').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    var row = chip.closest('.filters__row');
    var key = row.getAttribute('data-filter');
    filters[key] = chip.getAttribute('data-value');
    row.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });

  // Modal
  function openModal(p) {
    document.getElementById('modal-img').src = p.img;
    document.getElementById('modal-img').alt = p.name;
    document.getElementById('modal-title').textContent = p.name;
    document.getElementById('modal-meta').textContent = p.type + ' · ' + p.style;
    document.getElementById('modal-price').textContent = formatPrice(p.price);
    document.getElementById('modal-desc').textContent = p.desc;

    var specs = document.getElementById('modal-specs');
    specs.innerHTML = '';
    p.specs.forEach(function (pair) {
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      specs.appendChild(dt);
      specs.appendChild(dd);
    });

    document.getElementById('modal-request').onclick = function () {
      requestModel(p.name);
    };

    modal.hidden = false;
    modal.classList.remove('is-closing');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.body.style.overflow = '';
    if (reduceMotion) {
      modal.classList.remove('is-open');
      modal.hidden = true;
      return;
    }
    modal.classList.remove('is-open');
    modal.classList.add('is-closing');
    window.setTimeout(function () {
      modal.classList.remove('is-closing');
      modal.hidden = true;
    }, 250);
  }

  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  function requestModel(name) {
    closeModal();
    textarea.value = 'Здравствуйте! Интересует модель: ' + name + '.';
    var target = document.getElementById('request');
    target.scrollIntoView({ behavior: 'smooth' });
  }

  // Form validation
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var contact = form.contact.value.trim();
    var ok = true;

    setError('name', '');
    setError('contact', '');
    form.name.classList.remove('is-invalid');
    form.contact.classList.remove('is-invalid');

    if (!name) {
      setError('name', 'Укажите имя');
      form.name.classList.add('is-invalid');
      ok = false;
    }
    if (!contact) {
      setError('contact', 'Укажите телефон или Telegram');
      form.contact.classList.add('is-invalid');
      ok = false;
    }
    if (!ok) return;

    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function setError(field, msg) {
    var el = form.querySelector('[data-error="' + field + '"]');
    if (el) el.textContent = msg;
  }

  // Load data
  fetch('/data/products.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      products = data;
      render();
    })
    .catch(function () {
      grid.innerHTML = '<p class="card__empty">Не удалось загрузить каталог.</p>';
    });
})();
