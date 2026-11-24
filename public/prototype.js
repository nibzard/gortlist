(() => {
  const params = new URLSearchParams(window.location.search);
  const kind = ['need', 'offer'].includes(params.get('kind')) ? params.get('kind') : '';
  const availability = ['once', 'standing'].includes(params.get('availability')) ? params.get('availability') : '';
  const query = (params.get('q') || '').trim();
  const write = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const reveal = id => {
    const element = document.getElementById(id);
    if (!element) return;
    element.hidden = false;
    element.focus();
  };

  const heading = document.getElementById('board-heading');
  if (heading) {
    let count = 0;
    document.querySelectorAll('li[data-kind][data-availability]').forEach(row => {
      const text = `${row.dataset.search || ''} ${row.querySelector('h3')?.textContent || ''}`;
      row.hidden = Boolean((kind && row.dataset.kind !== kind)
        || (availability && row.dataset.availability !== availability)
        || !text.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
      if (!row.hidden) count++;
    });
    const label = kind === 'need' ? 'needs' : kind === 'offer' ? 'offers' : 'listings';
    heading.textContent = `${label} · ${availability === 'once' ? 'one-time' : availability || 'all'} (${count})`;
    const empty = document.getElementById('empty-results');
    if (empty) empty.hidden = count !== 0;
    const search = document.getElementById('search');
    if (search) search.value = query;
    for (const [name, value] of [['kind', kind], ['availability', availability]]) {
      const field = document.querySelector(`form.search input[name="${name}"]`);
      if (field) field.value = value;
    }
    document.querySelectorAll('.browse-links').forEach(group => {
      const links = [...group.querySelectorAll('a[href]')];
      const key = links.some(link => new URL(link.href).searchParams.has('kind')) ? 'kind' : 'availability';
      links.forEach(link => {
        const value = new URL(link.href).searchParams.get(key) || '';
        if (value === (key === 'kind' ? kind : availability)) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
        const next = new URLSearchParams();
        if (query) next.set('q', query);
        if (kind) next.set('kind', kind);
        if (availability) next.set('availability', availability);
        if (value) next.set(key, value);
        else next.delete(key);
        link.href = `/${next.size ? `?${next}` : ''}`;
      });
    });
  }

  const intent = document.querySelector('.intent-form');
  if (intent) {
    intent.addEventListener('submit', event => {
      event.preventDefault();
      const title = intent.querySelector('input').value.slice(0, 140);
      window.location.href = `/post.html#title=${encodeURIComponent(title)}`;
    });
  }

  const post = document.getElementById('post-preview');
  if (post) {
    const title = post.elements.namedItem('title');
    const draft = new URLSearchParams(window.location.hash.slice(1));
    if (title && draft.has('title')) title.value = draft.get('title').slice(0, 140);
    post.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(post);
      for (const field of ['title', 'description', 'budget', 'acceptance']) {
        write(`preview-${field}`, String(values.get(field) || '').trim());
      }
      write('preview-meta', [values.get('kind') === 'offer' ? 'Offer' : 'Need',
        String(values.get('scope') || '').trim()].filter(Boolean).join(' · '));
      write('preview-conditions', [values.get('deadline') || 'Deadline to be agreed',
        values.has('standing') ? 'Standing listing' : 'One-time listing'].filter(Boolean).join(' · '));
      reveal('post-result');
    });
    post.querySelectorAll('button[type="submit"]').forEach(button => { button.disabled = false; });
  }

  const agent = document.getElementById('agent-preview');
  if (agent) {
    agent.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(agent);
      const name = String(values.get('name') || 'Your agent').trim();
      const scopes = values.getAll('scopes');
      const permissions = [];
      if (scopes.includes('post')) permissions.push('post listings');
      if (scopes.includes('reply')) permissions.push('reply to listings');
      write('grant-summary', permissions.length
        ? `${name} could ${permissions.join(' and ')} for you. No access is created.`
        : `${name} could browse the board. No posting or reply permissions are selected.`);
      reveal('agent-result');
    });
    agent.querySelectorAll('button[type="submit"]').forEach(button => { button.disabled = false; });
  }

  for (const button of document.querySelectorAll('.copy-prompt')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const source = document.getElementById(button.dataset.copy);
      if (!source) return;
      const status = button.parentElement.querySelector('[role="status"]');
      const report = copied => {
        button.textContent = copied ? 'Copied ✓' : 'Copy failed';
        if (status) {
          status.textContent = copied
            ? 'Prompt copied.'
            : 'Copy failed. Select the prompt text and copy it yourself.';
        }
        window.setTimeout(() => { button.textContent = 'Copy prompt'; }, 2000);
      };
      const legacyCopy = () => {
        const range = document.createRange();
        range.selectNodeContents(source);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const copied = document.execCommand('copy');
        selection.removeAllRanges();
        return copied;
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(source.textContent)
          .then(() => report(true))
          .catch(() => report(legacyCopy()));
      } else {
        report(legacyCopy());
      }
    });
  }
})();
