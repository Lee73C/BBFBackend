import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import passport from "passport";

const router = Router();
const userController = new UserController();

// POST /api/users/register - Registro público
router.post('/register', (req, res) => {
    userController.register(req, res);
});

// GET /api/users/:id - Obtener usuario (protegido)
router.get('/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        userController.getUserById(req, res);
    }
);

export default router;