import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

function VariantSelector({ product, variants, onSelect, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Auto-select first variant if only one exists
    if (variants.length === 1) {
      setSelectedVariant(variants[0]);
    }
  }, [variants]);

  const handleSelect = () => {
    if (!selectedVariant) {
      alert("Please select a variant");
      return;
    }
    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }
    if (quantity > selectedVariant.stock) {
      alert("Not enough stock available");
      return;
    }
    onSelect({
      ...selectedVariant,
      quantity,
      productName: product.name,
      unitPrice: selectedVariant.price,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Select Variant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            Brand: {product.brand_name} | Category: {product.category_name}
          </p>
        </div>

        {/* Variant Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Available Variants
          </label>
          <select
            value={selectedVariant ? selectedVariant.id : ""}
            onChange={(e) => {
              const variant = variants.find((v) => v.id == e.target.value);
              setSelectedVariant(variant);
            }}
            className="w-full border rounded px-3 py-2 mb-2"
          >
            <option value="">-- Select a variant --</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.size}
                {v.variant_detail ? ` - ${v.variant_detail}` : ""} (
                {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"})
              </option>
            ))}
          </select>
        </div>

        {/* Variant Details */}
        {selectedVariant && (
          <div className="bg-gray-50 rounded p-3 mb-4">
            <p className="text-sm">
              <strong>SKU:</strong> {selectedVariant.sku}
            </p>
            <p className="text-sm">
              <strong>Size:</strong> {selectedVariant.size}
            </p>
            {selectedVariant.variant_detail && (
              <p className="text-sm">
                <strong>Detail:</strong> {selectedVariant.variant_detail}
              </p>
            )}
            <p className="text-lg font-bold text-blue-600 mt-2">
              Price: Rs. {selectedVariant.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Stock: {selectedVariant.stock}
            </p>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Quantity</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="border rounded px-3 py-2 w-20 text-center"
              min="1"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSelect}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Add to Cart
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default VariantSelector;
