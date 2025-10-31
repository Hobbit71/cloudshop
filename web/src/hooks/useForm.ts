import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'

type Validator<T> = ((values: T) => Partial<Record<keyof T, string>>) | z.ZodSchema<T>

/**
 * useForm
 * Simple controlled form state with optional Zod validation.
 *
 * Example:
 * const { values, errors, handleChange, handleSubmit } = useForm({
 *   initialValues: { email: '' },
 *   onSubmit: (v) => {},
 *   validate: z.object({ email: z.string().email() })
 * })
 */
export function useForm<T extends Record<string, any>>({ initialValues, onSubmit, validate }: { initialValues: T; onSubmit: (values: T) => void | Promise<void>; validate?: Validator<T> }) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any)

  const runValidation = useCallback((v: T) => {
    if (!validate) return {}
    if ('safeParse' in (validate as any)) {
      const parsed = (validate as z.ZodSchema<T>).safeParse(v)
      if (!parsed.success) {
        const out: Partial<Record<keyof T, string>> = {}
        parsed.error.issues.forEach((i) => { const key = i.path[0] as keyof T; out[key] = i.message })
        return out
      }
      return {}
    }
    return (validate as (values: T) => Partial<Record<keyof T, string>>)(v)
  }, [validate])

  const setFieldValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const name = e.target.name as keyof T
    setTouched((t) => ({ ...t, [name]: true }))
    const nextErrors = runValidation({ ...values, [name]: e.target.value })
    setErrors(nextErrors)
  }, [runValidation, values])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = runValidation(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) await onSubmit(values)
  }, [onSubmit, runValidation, values])

  return { values, errors, touched, setFieldValue, handleChange, handleBlur, handleSubmit, setValues, setErrors }
}


