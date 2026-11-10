import type * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = red CTA fill; secondary = red outline; danger = destructive action (crimson). Default primary. */
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  /** Renders an <a> instead of a <button>. */
  href?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface EyebrowProps { as?: 'span' | 'p' | 'div'; className?: string; children?: React.ReactNode }
export declare function Eyebrow(props: EyebrowProps): React.ReactElement;

export interface SectionHeaderProps {
  /** Section number shown before the title, e.g. "01". */
  number?: string;
  /** Heading level of the title. Default 2. */
  level?: 1 | 2 | 3;
  className?: string;
  children?: React.ReactNode;
}
export declare function SectionHeader(props: SectionHeaderProps): React.ReactElement;

export interface CalloutProps { title?: string; className?: string; children?: React.ReactNode }
export declare function Callout(props: CalloutProps): React.ReactElement;

export interface TableProps {
  columns: React.ReactNode[];
  rows: React.ReactNode[][];
  /** Header row: 'accent' = Storyville Red (default); 'inverse' = charcoal in light mode, off-white in dark mode. 'red' and 'dark' are accepted as old names. */
  header?: 'accent' | 'inverse' | 'red' | 'dark';
  caption?: string;
  className?: string;
}
export declare function Table(props: TableProps): React.ReactElement;

export interface CardProps { eyebrow?: string; title: React.ReactNode; footer?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Card(props: CardProps): React.ReactElement;

export interface SurfaceProps {
  /** default = page background; alt = svr-color-surface-alt; inverse = the opposite theme (charcoal band in light mode, off-white band in dark mode); red = Storyville Red in both themes. 'light' and 'dark' are accepted as old names for default and inverse. */
  tone?: 'default' | 'alt' | 'inverse' | 'red' | 'light' | 'dark';
  as?: 'section' | 'div' | 'header' | 'footer';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Surface(props: SurfaceProps): React.ReactElement;

export type StatusTone = 'danger' | 'success' | 'warning' | 'info';
export interface BadgeProps { tone?: 'neutral' | 'accent' | StatusTone; variant?: 'subtle' | 'solid'; className?: string; children?: React.ReactNode }
/** A status pill: one or two words, uppercase. The word carries the meaning; color reinforces it. */
export declare function Badge(props: BadgeProps): React.ReactElement;
export interface AlertProps { tone?: StatusTone; /** Defaults to Error / Success / Warning / Note. */ title?: string; className?: string; children?: React.ReactNode }
/** A status message box. tone="danger" is announced immediately (role="alert"); others politely (role="status"). */
export declare function Alert(props: AlertProps): React.ReactElement;

export interface FieldProps {
  label: React.ReactNode;
  help?: React.ReactNode;
  /** Error message; shown as "Error: …", linked to the control and sets aria-invalid. */
  error?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  id?: string;
  className?: string;
  /** Exactly one control: Input, Select or Textarea. */
  children: React.ReactElement;
}
export declare function Field(props: FieldProps): React.ReactElement;
export declare const Input: React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>;
export declare const Textarea: React.ForwardRefExoticComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.RefAttributes<HTMLTextAreaElement>>;
export declare const Select: React.ForwardRefExoticComponent<React.SelectHTMLAttributes<HTMLSelectElement> & React.RefAttributes<HTMLSelectElement>>;
export type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: React.ReactNode };
export declare const Checkbox: React.ForwardRefExoticComponent<ChoiceProps & React.RefAttributes<HTMLInputElement>>;
export declare const Radio: React.ForwardRefExoticComponent<ChoiceProps & React.RefAttributes<HTMLInputElement>>;

export interface ThemeToggleProps { className?: string }
/** A "Dark mode" toggle button (aria-pressed). Needs js/theme.js in the page head. */
export declare function ThemeToggle(props: ThemeToggleProps): React.ReactElement;
/** React apps (react/Storyville.jsx only): the current theme and a setter. */
export declare function useTheme(): ['light' | 'dark', (theme: 'light' | 'dark' | null) => void];

export interface SvrTheme {
  get(): 'light' | 'dark';
  set(theme: 'light' | 'dark' | null): void;
  toggle(): void;
  /** Forget the saved choice and follow the device setting again. */
  reset(): void;
}

declare global {
  interface Window {
    Storyville: { Button: typeof Button; Eyebrow: typeof Eyebrow; SectionHeader: typeof SectionHeader; Callout: typeof Callout; Table: typeof Table; Card: typeof Card; Surface: typeof Surface; ThemeToggle: typeof ThemeToggle; Badge: typeof Badge; Alert: typeof Alert; Field: typeof Field; Input: typeof Input; Textarea: typeof Textarea; Select: typeof Select; Checkbox: typeof Checkbox; Radio: typeof Radio };
    /** From js/theme.js. */
    svrTheme: SvrTheme;
  }
}
