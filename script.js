// Navegación accesible: sin JavaScript, todas las secciones permanecen legibles.
const panels = [...document.querySelectorAll('[data-network-panel]')];
const navigation = document.querySelector('[data-network-tablist]');

if (navigation && panels.length) {
  const tabs = [...navigation.querySelectorAll('a')];
  const keys = panels.map(panel => panel.id);
  const aliases = {red: 'quienes-somos', investigacion: 'proyectos', simposio: 'eventos', galeria: 'eventos'};
  navigation.setAttribute('role', 'tablist');
  navigation.setAttribute('aria-orientation', 'horizontal');

  tabs.forEach((tab, index) => {
    tab.id = 'tab-' + keys[index];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', keys[index]);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });

  function resolve(hash) {
    const id = hash.replace(/^#/, '');
    if (keys.includes(id)) return id;
    if (aliases[id]) return aliases[id];
    return document.getElementById(id)?.closest('[data-network-panel]')?.id;
  }

  function select(key, {save = false, focus = false, scroll = false, target = key} = {}) {
    const index = keys.indexOf(key);
    if (index < 0) return;
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    if (save && location.hash !== '#' + target) history.pushState(null, '', '#' + target);
    if (focus) tabs[index].focus({preventScroll: true});
    if (scroll) {
      const node = document.getElementById(target);
      const destination = node && node !== panels[index] && panels[index].contains(node)
        ? node : document.querySelector('.header');
      destination.scrollIntoView({behavior: 'instant', block: 'start'});
    }
  }

  navigation.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select(keys[tabs.indexOf(tab)], {save: true, scroll: true});
  });

  navigation.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target.closest('[role="tab"]'));
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    select(keys[next], {save: true, focus: true});
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || navigation.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const key = resolve(link.hash);
    if (!key) return;
    event.preventDefault();
    select(key, {save: true, focus: true, scroll: true, target: link.hash.slice(1)});
    if (link.classList.contains('skip')) panels[keys.indexOf(key)].focus({preventScroll: true});
  });

  const restore = () => select(resolve(location.hash) || 'historia', {
    focus: true, scroll: true, target: location.hash.slice(1) || 'historia'
  });
  addEventListener('popstate', restore);
  addEventListener('hashchange', restore);
  select(resolve(location.hash) || 'historia');
  if (location.hash && resolve(location.hash)) requestAnimationFrame(restore);
}

const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const country = document.querySelector('#country-filter');
const search = document.querySelector('#member-search');
if (country && search) {
  function filterMembers() {
    const term = normalize(search.value.trim());
    let memberCount = 0;
    let countryCount = 0;
    document.querySelectorAll('.country-group').forEach(group => {
      const countryMatches = !country.value || group.dataset.country === country.value;
      let count = 0;
      group.querySelectorAll('.member-card').forEach(card => {
        const matches = countryMatches && (!term || normalize(card.dataset.memberSearch).includes(term));
        card.hidden = !matches;
        if (matches) count++;
      });
      group.hidden = !countryMatches || Boolean(term && !count);
      if (!group.hidden) countryCount++;
      memberCount += count;
    });
    document.querySelector('#directory-status').textContent =
      `${memberCount} fichas de miembros · ${countryCount} países visibles` +
      (!memberCount ? ' · No hay fichas que coincidan con la búsqueda.' : '');
  }
  country.addEventListener('change', filterMembers);
  search.addEventListener('input', filterMembers);
  filterMembers();
}

const year = document.querySelector('#video-year');
if (year) year.addEventListener('change', () => {
  document.querySelectorAll('#resource-videos [data-video-year]').forEach(video => {
    video.hidden = Boolean(year.value && video.dataset.videoYear !== year.value);
  });
});

const viewer = document.querySelector('#network-viewer');
if (viewer) {
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      const photo = viewer.querySelector('img');
      photo.src = button.dataset.photo;
      photo.alt = button.dataset.caption || '';
      viewer.querySelector('p').textContent = photo.alt;
      viewer.showModal();
    });
  });
  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
}
