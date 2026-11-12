'use client';
// Storyville RD React components (ES module source for React apps: Vite, Next.js).
// Import it from the installed copy (e.g. vendor/svr_brand/react/Storyville.jsx; see INSTALL.md); never edit it in an app.
// Run js/theme.js in the page <head> and load dist/storyville.css once per app. Types: Storyville.d.ts beside this file.
// Mirrors components/storyville.global.js; props are documented in components/index.d.ts and docs/components/.
import React from 'react';

const cx = (...c) => c.filter(Boolean).join(' ');
const SURFACE = { default: '', light: '', alt: 'svr-surface-alt', inverse: 'svr-surface-inverse', dark: 'svr-surface-inverse', red: 'svr-surface-red' };

export function Button({ variant = 'primary', size = 'md', className, href, children, type, ...rest }) {
  const cls = cx('svr-btn', `svr-btn-${variant}`, size === 'sm' && 'svr-btn-sm', className);
  if (href) return <a {...rest} href={href} className={cls}>{children}</a>;
  return <button type={type || 'button'} {...rest} className={cls}>{children}</button>;
}

export function Eyebrow({ as: Tag = 'span', className, children }) {
  return <Tag className={cx('svr-eyebrow', className)}>{children}</Tag>;
}

export function SectionHeader({ number, level = 2, className, children }) {
  const H = `h${level}`;
  return (
    <div className={cx('svr-section', className)}>
      {number != null && <span className="svr-section-num svr-subheading-h2" aria-hidden="true">{number}</span>}
      <H className="svr-section-title svr-subheading-h2">{children}</H>
    </div>
  );
}

export function Callout({ title, className, children }) {
  return (
    <aside className={cx('svr-callout', 'svr-body', className)} role="note">
      {title && <span className="svr-callout-title svr-table-header">{title}</span>}
      {typeof children === 'string' ? <p className="svr-body">{children}</p> : children}
    </aside>
  );
}

export function Table({ columns = [], rows = [], header = 'accent', caption, className }) {
  const inverse = header === 'inverse' || header === 'dark';
  return (
    <table className={cx('svr-table', inverse && 'svr-table-inverse', className)}>
      {caption && <caption className="svr-caption" style={{ textAlign: 'left', paddingBottom: 'var(--svr-space-2)' }}>{caption}</caption>}
      <thead><tr>{columns.map((c, i) => <th key={i} scope="col" className="svr-table-header">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="svr-table-body">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function Card({ eyebrow, title, footer, className, children }) {
  return (
    <article className={cx('svr-card', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h3 className="svr-card-title svr-subheading-h2">{title}</h3>
      {children && <div className="svr-card-body svr-body">{children}</div>}
      {footer && <div className="svr-card-footer">{footer}</div>}
    </article>
  );
}

export function Surface({ tone = 'default', as: Tag = 'section', className, style, children }) {
  return <Tag className={cx('svr-surface', SURFACE[tone], 'svr-body', className)} style={style}>{children}</Tag>;
}

// ---------- Status ----------
const ALERT_WORD = { danger: 'Error', success: 'Success', warning: 'Warning', info: 'Note' };

export function Badge({ tone = 'neutral', variant = 'subtle', className, children }) {
  return <span className={cx('svr-badge', `svr-badge-${tone}`, variant === 'solid' && 'svr-badge-solid', className)}>{children}</span>;
}

export function Alert({ tone = 'info', title, className, children }) {
  return (
    <div className={cx('svr-alert', `svr-alert-${tone}`, 'svr-body', className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="svr-alert-title svr-table-header">{title || ALERT_WORD[tone]}</span>
      <div className="svr-alert-body">{typeof children === 'string' ? <p>{children}</p> : children}</div>
    </div>
  );
}

// ---------- Forms ----------
// Field wires the label, help and error to its one control (ids, aria-describedby, aria-invalid, required).
export function Field({ label, help, error, required, optional, id, className, children }) {
  const auto = React.useId();
  const cid = id || (children && children.props && children.props.id) || `svr-${auto}`;
  const helpId = help ? `${cid}-help` : undefined;
  const errId = error ? `${cid}-error` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;
  const control = React.isValidElement(children)
    ? React.cloneElement(children, { id: cid, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required: required || children.props.required })
    : children;
  return (
    <div className={cx('svr-field', className)}>
      <label className="svr-label" htmlFor={cid}>
        {label}{required && <span className="svr-label-required"> (required)</span>}{optional && <span className="svr-label-optional"> (optional)</span>}
      </label>
      {help && <p className="svr-help" id={helpId}>{help}</p>}
      {control}
      {error && <p className="svr-error" id={errId}>Error: {error}</p>}
    </div>
  );
}

export const Input = React.forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} {...rest} className={cx('svr-input', className)} />;
});
export const Textarea = React.forwardRef(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} {...rest} className={cx('svr-textarea', className)} />;
});
export const Select = React.forwardRef(function Select({ className, children, ...rest }, ref) {
  return <select ref={ref} {...rest} className={cx('svr-select', className)}>{children}</select>;
});
export const Checkbox = React.forwardRef(function Checkbox({ label, className, ...rest }, ref) {
  return <label className={cx('svr-choice', className)}><input ref={ref} type="checkbox" {...rest} className="svr-checkbox" /><span>{label}</span></label>;
});
export const Radio = React.forwardRef(function Radio({ label, className, ...rest }, ref) {
  return <label className={cx('svr-choice', className)}><input ref={ref} type="radio" {...rest} className="svr-radio" /><span>{label}</span></label>;
});

// Light/dark mode. Needs js/theme.js run in the page <head> (it defines window.svrTheme). Types: Storyville.d.ts.
export function useTheme() {
  const [theme, setThemeState] = React.useState('light');
  React.useEffect(() => {
    if (window.svrTheme) setThemeState(window.svrTheme.get());
    const on = (e) => setThemeState(e.detail.theme);
    window.addEventListener('svr-themechange', on);
    return () => window.removeEventListener('svr-themechange', on);
  }, []);
  const setTheme = (t) => window.svrTheme && window.svrTheme.set(t);
  return [theme, setTheme];
}

export function ThemeToggle({ className }) {
  const [theme] = useTheme();
  const [pinned, setPinned] = React.useState(false);
  React.useEffect(() => { setPinned(!!(window.svrTheme && window.svrTheme.pinned)); }, []);
  const dark = theme === 'dark';
  if (pinned) return null; // always-light page: no toggle
  return (
    <button type="button" className={cx('svr-theme-toggle', className)} aria-label="Dark mode" aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => window.svrTheme && window.svrTheme.toggle()}>
      {/* Icon only (never text). Current mode large/top-left, other mode small/bottom-right; arrows say "click to switch". Animation is in css/components.css. */}
      <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
        <g className="svr-tt-arrows" fill="currentColor" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
          <g>
            <path fill="none" d="M30.97 9.05 A16.5 16.5 0 0 1 40.25 21.14" />
            <polygon stroke="none" points="40.6,23.3 43.0,17.9 36.7,19.0" />
          </g>
          <g transform="rotate(180 24 24)">
            <path fill="none" d="M30.97 9.05 A16.5 16.5 0 0 1 40.25 21.14" />
            <polygon stroke="none" points="40.6,23.3 43.0,17.9 36.7,19.0" />
          </g>
        </g>
        <g className="svr-tt-sun" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="24" cy="24" r="4.2" />
          <path d="M24 14.5v2.3M24 31.2v2.3M14.5 24h2.3M31.2 24h2.3M17.3 17.3l1.6 1.6M29.1 29.1l1.6 1.6M17.3 30.7l1.6-1.6M29.1 18.9l1.6-1.6" />
        </g>
        <g className="svr-tt-moon" fill="currentColor"><path d="M32.8 24.8A9 9 0 1 1 23.2 15a7 7 0 0 0 9.6 9.8z" /></g>
      </svg>
    </button>
  );
}
