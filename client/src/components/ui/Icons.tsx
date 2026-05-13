interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

const base = (children: React.ReactNode, size: number, sw: number, className?: string) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
)

export const BookOpenIcon  = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>, size, strokeWidth, className)

export const StarIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>, size, strokeWidth, className)

export const UserIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, size, strokeWidth, className)

export const LeafIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>, size, strokeWidth, className)

export const ShoppingBagIcon= ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>, size, strokeWidth, className)

export const FolderIcon     = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>, size, strokeWidth, className)

export const CalendarIcon   = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, size, strokeWidth, className)

export const SparkleIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/></>, size, strokeWidth, className)

export const SearchIcon     = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, size, strokeWidth, className)

export const SlidersIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>, size, strokeWidth, className)

export const PlusIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, size, strokeWidth, className)

export const ArrowLeftIcon  = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, size, strokeWidth, className)

export const PencilIcon     = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, size, strokeWidth, className)

export const TrashIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>, size, strokeWidth, className)

export const PrinterIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, size, strokeWidth, className)

export const ClockIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, size, strokeWidth, className)

export const FlameIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>, size, strokeWidth, className)

export const UsersIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, size, strokeWidth, className)

export const XIcon          = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, size, strokeWidth, className)

export const ChevronDownIcon= ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<polyline points="6 9 12 15 18 9"/>, size, strokeWidth, className)

export const LightbulbIcon  = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></>, size, strokeWidth, className)

export const GridIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>, size, strokeWidth, className)

export const BarChartIcon   = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>, size, strokeWidth, className)

export const CheckIcon      = ({ size = 16, strokeWidth = 2, className }: IconProps) => base(<polyline points="20 6 9 17 4 12"/>, size, strokeWidth, className)

export const LinkIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>, size, strokeWidth, className)
