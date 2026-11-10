// Types for react/Storyville.jsx. TypeScript resolves `import { Button } from './Storyville'` to this file,
// so apps with strict mode and no allowJs get full types. It also declares window.svrTheme (from js/theme.js).
import type * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = red CTA fill; secondary = red outline; danger = destructive action (crimson). Default primary. */
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  /** Renders an <a> instead of a <button>. */
  href?: string;
}
export declare function Button(props: ButtonProps): React.JSX.Element;

export interface EyebrowProps { as?: 'span' | 'p' | 'div'; className?: string; children?: React.ReactNode }
export declare function Eyebrow(props: EyebrowProps): React.JSX.Element;

export interface SectionHeaderProps {
  /** Section number shown before the title, e.g. "01". */
  number?: string;
  /** Heading level of the title. Default 2. */
  level?: 1 | 2 | 3 | 4;
  className?: string;
  children?: React.ReactNode;
}
export declare function SectionHeader(props: SectionHeaderProps): React.JSX.Element;

export interface CalloutProps { title?: string; className?: string; children?: React.ReactNode }
export declare function Callout(props: CalloutProps): React.JSX.Element;

export interface TableProps {
  columns: React.ReactNode[];
  rows: React.ReactNode[][];
  /** 'accent' = Storyville Red header (default); 'inverse' = charcoal in light mode, off-white in dark. 'red'/'dark' are old names. */
  header?: 'accent' | 'inverse' | 'red' | 'dark';
  caption?: string;
  className?: string;
}
export declare function Table(props: TableProps): React.JSX.Element;

export interface CardProps { eyebrow?: string; title: React.ReactNode; footer?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Card(props: CardProps): React.JSX.Element;

export interface SurfaceProps {
  /** default = page background; alt = surface-alt; inverse = the opposite theme; red = Storyville Red. 'light'/'dark' are old names. */
  tone?: 'default' | 'alt' | 'inverse' | 'red' | 'light' | 'dark';
  as?: 'section' | 'div' | 'header' | 'footer' | 'aside' | 'main';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Surface(props: SurfaceProps): React.JSX.Element;

export type StatusTone = 'danger' | 'success' | 'warning' | 'info';
export interface BadgeProps { tone?: 'neutral' | 'accent' | StatusTone; variant?: 'subtle' | 'solid'; className?: string; children?: React.ReactNode }
/** A status pill: one or two words. The word carries the meaning; color reinforces it. */
export declare function Badge(props: BadgeProps): React.JSX.Element;

export interface AlertProps {
  tone?: StatusTone;
  /** Defaults to Error / Success / Warning / Note. */
  title?: string;
  className?: string;
  children?: React.ReactNode;
}
/** A status message. tone="danger" is announced immediately (role="alert"); others politely (role="status"). */
export declare function Alert(props: AlertProps): React.JSX.Element;

export interface FieldProps {
  label: React.ReactNode;
  help?: React.ReactNode;
  /** Error message: shown as "Error: …", linked to the control, and sets aria-invalid. */
  error?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  id?: string;
  className?: string;
  /** Exactly one control: Input, Select or Textarea. */
  children: React.ReactElement;
}
export declare function Field(props: FieldProps): React.JSX.Element;

export declare const Input: React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>;
export declare const Textarea: React.ForwardRefExoticComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.RefAttributes<HTMLTextAreaElement>>;
export declare const Select: React.ForwardRefExoticComponent<React.SelectHTMLAttributes<HTMLSelectElement> & React.RefAttributes<HTMLSelectElement>>;
export type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: React.ReactNode };
export declare const Checkbox: React.ForwardRefExoticComponent<ChoiceProps & React.RefAttributes<HTMLInputElement>>;
export declare const Radio: React.ForwardRefExoticComponent<ChoiceProps & React.RefAttributes<HTMLInputElement>>;

export type Theme = 'light' | 'dark';
/** The current theme and a setter (null = follow the device setting). Starts as 'light' until mounted. */
export declare function useTheme(): [Theme, (theme: Theme | null) => void];

export interface ThemeToggleProps { className?: string }
/** The "Dark mode" toggle button (aria-pressed). Renders nothing on a pinned (always-light) page. */
export declare function ThemeToggle(props: ThemeToggleProps): React.JSX.Element | null;

export interface SvrTheme {
  get(): Theme;
  set(theme: Theme | null): void;
  toggle(): void;
  reset(): void;
  readonly pinned: boolean;
}
declare global {
  interface Window { svrTheme: SvrTheme }
  interface WindowEventMap { 'svr-themechange': CustomEvent<{ theme: Theme }> }
}
