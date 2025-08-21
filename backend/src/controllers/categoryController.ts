import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';

export const createCategory = async (req: Request, res: Response) => {
  const category = new Category(req.body);
  await category.save();

  res.status(201).json({
    success: true,
    data: category,
  });
};

export const getCategories = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);

  const skip = (page - 1) * limit;
  const [categories, total] = await Promise.all([
    Category.find()
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    Category.countDocuments(),
  ]);

  const result = createPaginationResult(categories, total, page, limit);

  res.json({
    success: true,
    ...result,
  });
};

export const getCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw createError('Category not found', 404);
  }

  res.json({
    success: true,
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
  if (!category) {
    throw createError('Category not found', 404);
  }

  res.json({
    success: true,
    data: category,
  });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw createError('Category not found', 404);
  }

  res.json({
    success: true,
  });
};