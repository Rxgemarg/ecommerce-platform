import { ProductTypesList } from './components/ProductTypesList'
import { ProductGrid } from './components/ProductGrid'

async function getProductTypes() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product-types`, {
      cache: 'no-store'
    })
    if (!res.ok) return { productTypes: [] }
    return res.json()
  } catch (error) {
    console.error('Error fetching product types:', error)
    return { productTypes: [] }
  }
}

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/search`, {
      cache: 'no-store'
    })
    if (!res.ok) return { products: [] }
    return res.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    return { products: [] }
  }
}

export default async function Home() {
  const [{ productTypes }, { products }] = await Promise.all([
    getProductTypes(),
    getProducts()
  ])

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-4">
        Welcome to Our Shop
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Discover our amazing products
      </p>
      
      <ProductTypesList productTypes={productTypes} />
      <ProductGrid products={products} />
    </main>
  )
}