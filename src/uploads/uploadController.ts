import { Request, Response } from 'express';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Use field name "file".',
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file_name: req.file.filename,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error('Upload file controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};
