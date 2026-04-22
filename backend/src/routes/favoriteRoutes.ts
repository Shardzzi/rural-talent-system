import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getUserFavorites,
    addFavorite,
    removeFavorite,
    updateFavoriteNotes
} from '../controllers/favoritesController';

const router: Router = express.Router();

router.get('/favorites', authenticateToken, getUserFavorites);
router.post('/favorites/:personId', authenticateToken, addFavorite);
router.delete('/favorites/:personId', authenticateToken, removeFavorite);
router.put('/favorites/:personId', authenticateToken, updateFavoriteNotes);

export default router;
