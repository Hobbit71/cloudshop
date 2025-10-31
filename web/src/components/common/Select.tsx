import { SelectHTMLAttributes, forwardRef } from 'react'

export type SelectOption = { value: string; label: string; disabled?: boolean }

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: SelectOption[]
  error?: string
}

// Example:
// <Select label="Sort" options={[{value:'price',label:'Price'}]} />
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, options, error, className = '', ...props }, ref) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-gray-700">{label}</span>}
      <select
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.name}-error` : undefined}
        className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-brand/30 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
      {error && (
        <span id={`${props.name}-error`} role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  )
})

export default Select


