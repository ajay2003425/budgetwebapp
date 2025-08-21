import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  name: string;
  departmentId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  amount: number;
  spent: number;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  remaining: number;
}

const budgetSchema = new Schema<IBudget>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    period: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for remaining amount
budgetSchema.virtual('remaining').get(function () {
  return this.amount - this.spent;
});

// Indexes
budgetSchema.index({ departmentId: 1, categoryId: 1, status: 1 });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);