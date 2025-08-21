import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { createError } from '../middleware/errorHandler';
import { getPaginationOptions, createPaginationResult } from '../utils/pagination';

export const createDepartment = async (req: Request, res: Response) => {
  const department = new Department(req.body);
  await department.save();

  res.status(201).json({
    success: true,
    data: department,
  });
};

export const getDepartments = async (req: Request, res: Response) => {
  const { page, limit } = getPaginationOptions(req.query);

  const skip = (page - 1) * limit;
  const [departments, total] = await Promise.all([
    Department.find()
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    Department.countDocuments(),
  ]);

  const result = createPaginationResult(departments, total, page, limit);

  res.json({
    success: true,
    ...result,
  });
};

export const getDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const department = await Department.findById(id);
  if (!department) {
    throw createError('Department not found', 404);
  }

  res.json({
    success: true,
    data: department,
  });
};

export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await Department.findByIdAndUpdate(id, req.body, { new: true });
  if (!department) {
    throw createError('Department not found', 404);
  }

  res.json({
    success: true,
    data: department,
  });
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await Department.findByIdAndDelete(id);
  if (!department) {
    throw createError('Department not found', 404);
  }

  res.json({
    success: true,
  });
};