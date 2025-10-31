import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@test/utils'
import userEvent from '@testing-library/user-event'
import ProductCard from './ProductCard'
import { createMockProduct } from '@test/mocks'

describe('ProductCard', () => {
  it('renders product name and price', () => {
    const product = createMockProduct()
    render(<ProductCard id={product.id} name={product.name} price={product.price} />)
    expect(screen.getByText(product.name)).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
  })

  it('calls onAddToCart when button clicked', async () => {
    const user = userEvent.setup()
    const onAddToCart = vi.fn()
    const product = createMockProduct()
    render(
      <ProductCard
        id={product.id}
        name={product.name}
        price={product.price}
        onAddToCart={onAddToCart}
      />
    )
    const button = screen.getByRole('button', { name: /add to cart/i })
    await user.click(button)
    expect(onAddToCart).toHaveBeenCalledTimes(1)
  })

  it('renders image when provided', () => {
    const product = createMockProduct()
    render(
      <ProductCard
        id={product.id}
        name={product.name}
        price={product.price}
        imageUrl="https://example.com/image.jpg"
      />
    )
    const img = screen.getByAltText('Product image')
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('links to product detail page', () => {
    const product = createMockProduct()
    render(<ProductCard id={product.id} name={product.name} price={product.price} />)
    const link = screen.getByRole('link', { name: product.name })
    expect(link).toHaveAttribute('href', `/products/${product.id}`)
  })
})

