import { api } from './api';

export interface UploadResponse {
  url: string;
}

class UploadService {
  async uploadReceipt(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await api.post('/uploads/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

export const uploadService = new UploadService();