import { InputHTMLAttributes, forwardRef } from 'react'
import { z } from 'zod'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  schema?: z.ZodTypeAny
}

// Example:
// <Input label="Email" type="email" schema={z.string().email()} />
const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, schema, className = '', onBlur, ...props }, ref) {
  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    if (schema) {
      const res = schema.safeParse(e.currentTarget.value)
      if (!res.success) {
        // noop: parent can also control `error` prop
      }
    }
    onBlur?.(e)
  }

  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-gray-700">{label}</span>}
      <input
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.name}-error` : undefined}
        className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-brand/30 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <span id={`${props.name}-error`} role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  )
})

export default Input


