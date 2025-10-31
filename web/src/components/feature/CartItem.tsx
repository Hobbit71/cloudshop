import Button from '@components/common/Button'
import { formatCurrency } from '@utils/formatCurrency'

export type CartItemProps = {
  id: string
  name: string
  price: number
  onRemove?: (id: string) => void
}

// Example:
// <CartItem id="1" name="T-Shirt" price={19.99} onRemove={remove} />
export default function CartItem({ id, name, price, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between rounded border bg-white p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-600">{formatCurrency(price)}</p>
      </div>
      <Button variant="secondary" aria-label={`Remove ${name} from cart`} onClick={() => onRemove?.(id)}>Remove</Button>
    </div>
  )
}


