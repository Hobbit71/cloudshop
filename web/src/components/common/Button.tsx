import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60'
  const styles = variant === 'primary'
    ? 'bg-brand text-white hover:bg-brand-dark focus:ring-brand'
    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}


