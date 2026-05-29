import type { ReactElement, SVGProps } from 'react';
import type { IconName } from './types';

type IconProps = SVGProps<SVGSVGElement> & {
  sw?: number;
};

function baseProps({ sw = 1.5, ...props }: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export const icons: Record<IconName, (props: IconProps) => ReactElement> = {
  alert: (props) => (
    <svg {...baseProps(props)}>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" />
    </svg>
  ),
  bell: (props) => (
    <svg {...baseProps(props)}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  file: (props) => (
    <svg {...baseProps(props)}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  box: (props) => (
    <svg {...baseProps(props)}>
      <path d="M3 7 12 3l9 4-9 4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  ),
  gauge: (props) => (
    <svg {...baseProps(props)}>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14l4-4" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  nav: (props) => (
    <svg {...baseProps(props)}>
      <path d="M3 11 21 4l-7 17-2-8z" />
    </svg>
  ),
  mic: (props) => (
    <svg {...baseProps(props)}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  ),
  power: (props) => (
    <svg {...baseProps(props)}>
      <path d="M12 3v9" />
      <path d="M6 7a8 8 0 1 0 12 0" />
    </svg>
  ),
  car: (props) => (
    <svg {...baseProps(props)}>
      <path d="M4 14l2-5a3 3 0 0 1 3-2h6a3 3 0 0 1 3 2l2 5" />
      <path d="M3 14h18v4H3z" />
      <circle cx="7" cy="18" r="1.3" />
      <circle cx="17" cy="18" r="1.3" />
    </svg>
  ),
  close: (props) => (
    <svg {...baseProps(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  min: (props) => (
    <svg {...baseProps(props)}>
      <path d="M5 12h14" />
    </svg>
  ),
  max: (props) => (
    <svg {...baseProps(props)}>
      <path d="M4 10V4h6M20 14v6h-6M4 14v6h6M20 10V4h-6" />
    </svg>
  ),
  sparkles: (props) => (
    <svg {...baseProps(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
    </svg>
  ),
  wrench: (props) => (
    <svg {...baseProps(props)}>
      <path d="M15 4a5 5 0 0 0-5 6l-6 6a2 2 0 0 0 2.8 2.8l6-6a5 5 0 0 0 6-6l-2.5 2.5-2-.5-.5-2z" />
    </svg>
  ),
  plus: (props) => (
    <svg {...baseProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  route: (props) => (
    <svg {...baseProps(props)}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6" />
    </svg>
  ),
  signal: (props) => (
    <svg {...baseProps(props)}>
      <path d="M3 19h2v-4H3zM8 19h2V11H8zM13 19h2V7h-2zM18 19h2V3h-2z" />
    </svg>
  ),
  cpu: (props) => (
    <svg {...baseProps(props)}>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  hdd: (props) => (
    <svg {...baseProps(props)}>
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <path d="M12 12h6" />
    </svg>
  ),
  map: (props) => (
    <svg {...baseProps(props)}>
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  ),
  search: (props) => (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
  plug: (props) => (
    <svg {...baseProps(props)}>
      <path d="M9 2v6M15 2v6" />
      <path d="M7 8h10v3a5 5 0 0 1-10 0z" />
      <path d="M12 16v6" />
    </svg>
  ),
  reload: (props) => (
    <svg {...baseProps(props)}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  ),
};

interface IconComponentProps extends IconProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconComponentProps) {
  const Component = icons[name];
  return <Component aria-hidden="true" focusable="false" {...props} />;
}
