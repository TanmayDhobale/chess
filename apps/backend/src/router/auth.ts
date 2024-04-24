import { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import logger from 'your-logger-library'; // Replace with your logger library , I would recommend either Winston or Pino, 

const router = Router();

const CLIENT_URL = process.env.AUTH_REDIRECT_URL ?? 'http://localhost:5173/game/random';
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface User {
  id: string;
}

router.get('/refresh', async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as User;
    // Token is issued so it can be shared b/w HTTP and ws server
    // Todo: Make this temporary and add refresh logic here
    const userDb = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({
      token,
      id: user.id,
      name: userDb?.name,
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

router.get('/login/failed', (req: Request, res: Response) => {
  res.status(401).json({ success: false, message: 'failure' });
});

router.get('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      logger.error('Error logging out:', err);
      res.status(500).json({ error: 'Failed to log out' });
    } else {
      res.clearCookie('jwt');
      res.redirect('http://localhost:5173/');
    }
  });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: CLIENT_URL,
  failureRedirect: '/login/failed',
}), (err, req, res, next) => {
  if (err) {
    logger.error('Error during Google authentication:', err);
    // Handle the error here
  }
  next();
});

router.get('/github', passport.authenticate('github', { scope: ['profile', 'email'] }));

router.get('/github/callback', passport.authenticate('github', {
  successRedirect: CLIENT_URL,
  failureRedirect: '/login/failed',
}), (err, req, res, next) => {
  if (err) {
    logger.error('Error during GitHub authentication:', err);
    // Handle the error here
  }
  next();
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['profile'] }));

router.get('/facebook/callback', passport.authenticate('facebook', {
  successRedirect: CLIENT_URL,
  failureRedirect: '/login/failed',
}), (err, req, res, next) => {
  if (err) {
    logger.error('Error during Facebook authentication:', err);
    // Handle the error here
  }
  next();
});

export default router;
