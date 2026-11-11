import { Link } from 'react-router-dom';
import { formatBaht } from '../api/backend';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
    >
      <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-800">{product.name}</p>
        <p className="mt-2 font-bold text-red-600">{formatBaht(product.priceSatang)}</p>
        {product.stock === 0 && <p className="text-xs text-slate-400">สินค้าหมด</p>}
      </div>
    </Link>
  );
}