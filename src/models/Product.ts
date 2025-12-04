import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  stock: number;
  sku: string;
  tags: string[];
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  onSale: boolean;
  discount?: number;
  specifications: {
    weight?: string;
    dimensions?: string;
    burnTime?: string;
    scent?: string;
    material?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String, required: true, unique: true },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    discount: { type: Number, min: 0, max: 100 },
    specifications: {
      weight: String,
      dimensions: String,
      burnTime: String,
      scent: String,
      material: String,
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
