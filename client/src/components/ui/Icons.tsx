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

export const HomeIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></>, size, strokeWidth, className)

export const SunIcon        = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>, size, strokeWidth, className)

export const MoonIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>, size, strokeWidth, className)

export const ChefHatIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></>, size, strokeWidth, className)

export const PlayIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<polygon points="6 3 20 12 6 21 6 3"/>, size, strokeWidth, className)

export const PauseIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>, size, strokeWidth, className)

export const TimerIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/></>, size, strokeWidth, className)

export const ChevronLeftIcon  = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<polyline points="15 18 9 12 15 6"/>, size, strokeWidth, className)

export const ChevronRightIcon = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<polyline points="9 18 15 12 9 6"/>, size, strokeWidth, className)

export const ShareIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>, size, strokeWidth, className)

export const ShuffleIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></>, size, strokeWidth, className)

export const MenuIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>, size, strokeWidth, className)

export const ListIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></>, size, strokeWidth, className)

export const MinusIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<line x1="5" y1="12" x2="19" y2="12"/>, size, strokeWidth, className)

export const SendIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>, size, strokeWidth, className)

export const BookmarkIcon   = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>, size, strokeWidth, className)

export const CameraIcon     = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>, size, strokeWidth, className)

export const ArrowRightIcon = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, size, strokeWidth, className)

export const CommandIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>, size, strokeWidth, className)

export const MoreIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>, size, strokeWidth, className)

export const RefreshIcon    = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>, size, strokeWidth, className)

export const HeartIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>, size, strokeWidth, className)

export const MaximizeIcon   = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>, size, strokeWidth, className)

export const CopyIcon       = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, size, strokeWidth, className)

export const ScaleIcon      = ({ size = 16, strokeWidth = 1.5, className }: IconProps) => base(<><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/><path d="M8 21h8"/></>, size, strokeWidth, className)
