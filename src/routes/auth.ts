import { Router, Request, Response } from 'express';
import { loginUser, hashPassword } from '../services/authService';

const router = Router();

interface LoginRequest extends Request {
  body: {
    mobile: string;
    password: string;
  };
}

router.post('/login', async (req: LoginRequest, res: Response) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required',
      });
    }

    const result = await loginUser(mobile, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
});

export default router;
