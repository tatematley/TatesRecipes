import React from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const iconOnly = !children && (icon || iconRight)
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        iconOnly ? styles.iconOnly : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className={styles.icon}>{iconRight}</span>}
    </button>
  )
}
