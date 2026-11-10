/* @ds-bundle: {"format":4,"namespace":"Storyville","components":[{"name":"Button"},{"name":"Eyebrow"},{"name":"SectionHeader"},{"name":"Callout"},{"name":"Table"},{"name":"Card"},{"name":"Surface"},{"name":"ThemeToggle"},{"name":"Badge"},{"name":"Alert"},{"name":"Field"},{"name":"Input"},{"name":"Textarea"},{"name":"Select"},{"name":"Checkbox"},{"name":"Radio"}]} */
(function () {
  var R = window.React, h = R.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }
  var SURFACE = { 'default': '', light: '', alt: 'svr-surface-alt', inverse: 'svr-surface-inverse', dark: 'svr-surface-inverse', red: 'svr-surface-red' };

  function Button(p) {
    var variant = p.variant || 'primary', size = p.size || 'md';
    var rest = omit(p, ['variant', 'size', 'className', 'children', 'href']);
    rest.className = cx('svr-btn', 'svr-btn-' + variant, size === 'sm' && 'svr-btn-sm', p.className);
    if (p.href) { rest.href = p.href; return h('a', rest, p.children); }
    if (!rest.type) rest.type = 'button';
    return h('button', rest, p.children);
  }

  function Eyebrow(p) {
    return h(p.as || 'span', { className: cx('svr-eyebrow', p.className) }, p.children);
  }

  function SectionHeader(p) {
    var level = p.level || 2;
    return h('div', { className: cx('svr-section', p.className) },
      p.number != null ? h('span', { className: 'svr-section-num svr-subheading-h2', 'aria-hidden': 'true' }, p.number) : null,
      h('h' + level, { className: 'svr-section-title svr-subheading-h2' }, p.children));
  }

  function Callout(p) {
    var body = typeof p.children === 'string' ? h('p', { className: 'svr-body' }, p.children) : p.children;
    return h('aside', { className: cx('svr-callout', 'svr-body', p.className), role: 'note' },
      p.title ? h('span', { className: 'svr-callout-title svr-table-header' }, p.title) : null, body);
  }

  function Table(p) {
    var cols = p.columns || [], rows = p.rows || [], inverse = p.header === 'inverse' || p.header === 'dark';
    return h('table', { className: cx('svr-table', inverse && 'svr-table-inverse', p.className) },
      p.caption ? h('caption', { className: 'svr-caption', style: { textAlign: 'left', paddingBottom: 'var(--svr-space-2)' } }, p.caption) : null,
      h('thead', null, h('tr', null, cols.map(function (c, i) { return h('th', { key: i, scope: 'col', className: 'svr-table-header' }, c); }))),
      h('tbody', null, rows.map(function (r, i) {
        return h('tr', { key: i }, r.map(function (c, j) { return h('td', { key: j, className: 'svr-table-body' }, c); }));
      })));
  }

  function Card(p) {
    return h('article', { className: cx('svr-card', p.className) },
      p.eyebrow ? h(Eyebrow, null, p.eyebrow) : null,
      h('h3', { className: 'svr-card-title svr-subheading-h2' }, p.title),
      p.children ? h('div', { className: 'svr-card-body svr-body' }, p.children) : null,
      p.footer ? h('div', { className: 'svr-card-footer' }, p.footer) : null);
  }

  function Surface(p) {
    return h(p.as || 'section', { className: cx('svr-surface', SURFACE[p.tone || 'default'], 'svr-body', p.className), style: p.style }, p.children);
  }

  // Status
  var ALERT_WORD = { danger: 'Error', success: 'Success', warning: 'Warning', info: 'Note' };
  function Badge(p) {
    var tone = p.tone || 'neutral';
    return h('span', { className: cx('svr-badge', 'svr-badge-' + tone, p.variant === 'solid' && 'svr-badge-solid', p.className) }, p.children);
  }
  function Alert(p) {
    var tone = p.tone || 'info';
    return h('div', { className: cx('svr-alert', 'svr-alert-' + tone, 'svr-body', p.className), role: tone === 'danger' ? 'alert' : 'status' },
      h('span', { className: 'svr-alert-title svr-table-header' }, p.title || ALERT_WORD[tone]),
      h('div', { className: 'svr-alert-body' }, typeof p.children === 'string' ? h('p', null, p.children) : p.children));
  }

  // Forms
  function Field(p) {
    var auto = R.useId();
    var child = p.children;
    var cid = p.id || (child && child.props && child.props.id) || ('svr-' + auto);
    var helpId = p.help ? cid + '-help' : undefined, errId = p.error ? cid + '-error' : undefined;
    var describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;
    var control = R.isValidElement(child)
      ? R.cloneElement(child, { id: cid, 'aria-describedby': describedBy, 'aria-invalid': p.error ? true : undefined, required: p.required || child.props.required })
      : child;
    return h('div', { className: cx('svr-field', p.className) },
      h('label', { className: 'svr-label', htmlFor: cid }, p.label,
        p.required ? h('span', { className: 'svr-label-required' }, ' (required)') : null,
        p.optional ? h('span', { className: 'svr-label-optional' }, ' (optional)') : null),
      p.help ? h('p', { className: 'svr-help', id: helpId }, p.help) : null,
      control,
      p.error ? h('p', { className: 'svr-error', id: errId }, 'Error: ', p.error) : null);
  }
  function control(tag, cls) {
    return R.forwardRef(function (p, ref) {
      var rest = omit(p, ['className']); rest.ref = ref; rest.className = cx(cls, p.className);
      return h(tag, rest, tag === 'select' ? p.children : undefined);
    });
  }
  var Input = control('input', 'svr-input'), Textarea = control('textarea', 'svr-textarea'), Select = control('select', 'svr-select');
  function choice(type, cls) {
    return R.forwardRef(function (p, ref) {
      var rest = omit(p, ['label', 'className']); rest.ref = ref; rest.type = type; rest.className = cls;
      return h('label', { className: cx('svr-choice', p.className) }, h('input', rest), h('span', null, p.label));
    });
  }
  var Checkbox = choice('checkbox', 'svr-checkbox'), Radio = choice('radio', 'svr-radio');

  // Light/dark mode. Uses window.svrTheme from js/theme.js.
  function currentTheme() {
    if (window.svrTheme) return window.svrTheme.get();
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function ThemeToggle(p) {
    var st = R.useState(currentTheme), theme = st[0], setTheme = st[1];
    R.useEffect(function () {
      function on(e) { setTheme(e.detail.theme); }
      window.addEventListener('svr-themechange', on);
      return function () { window.removeEventListener('svr-themechange', on); };
    }, []);
    if (window.svrTheme && window.svrTheme.pinned) return null; // always-light page: no toggle
    var dark = theme === 'dark';
    function toggle() {
      if (window.svrTheme) { window.svrTheme.toggle(); return; }
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
    }
    return h('button', { type: 'button', className: cx('svr-btn', 'svr-btn-sm', 'svr-theme-toggle', p.className), 'aria-pressed': dark, onClick: toggle },
      'Dark mode', h('span', { 'aria-hidden': 'true' }, dark ? ': On' : ': Off'));
  }

  var C = window;
  C.Storyville = C.Storyville || {};
  Object.assign(C.Storyville, { Button: Button, Eyebrow: Eyebrow, SectionHeader: SectionHeader, Callout: Callout, Table: Table, Card: Card, Surface: Surface, ThemeToggle: ThemeToggle, Badge: Badge, Alert: Alert, Field: Field, Input: Input, Textarea: Textarea, Select: Select, Checkbox: Checkbox, Radio: Radio });
})();
