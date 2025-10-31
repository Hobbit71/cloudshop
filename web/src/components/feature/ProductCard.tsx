import Card from '@components/common/Card'
import Button from '@components/common/Button'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@utils/formatCurrency'

export type ProductCardProps = {
  id: string
  name: string
  price: number
  imageUrl?: string
  onAddToCart?: () => void
}

// Example:
// <ProductCard id="1" name="T-Shirt" price={19.99} onAddToCart={()=>{}} />
export default function ProductCard({ id, name, price, imageUrl, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="Product image" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gray-100" aria-label="No image" />
      )}
      <div className="p-4 space-y-2">
        <Link to={`/products/${id}`} className="block text-lg font-medium hover:underline">{name}</Link>
        <p className="text-brand">{formatCurrency(price)}</p>
        <Button aria-label={`Add ${name} to cart`} onClick={onAddToCart}>Add to cart</Button>
      </div>
    </Card>
  )
}


