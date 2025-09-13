import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends mongoose.Model<IUser> {
  safeUser(user: IUser): SafeUser;
}

export interface SafeUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'USER'],
      default: 'USER',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });

// Instance method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method for safe user data
userSchema.statics.safeUser = function (user: IUser): SafeUser {
  return {
    _id: user._id as mongoose.Types.ObjectId,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);