import { Router } from 'express';
import UserController from '../controllers/UserController.js'; // CORREGIDO: default import
import passport from "passport";

const router = Router();
const userController = new UserController();

// POST /api/users/register - Registro público
router.post('/register', (req, res) => {
    console.log('📍 [Route] POST /api/users/register');
    userController.register(req, res);
});

// GET /api/users/:id - Obtener usuario (protegido)
router.get('/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        console.log('📍 [Route] GET /api/users/:id con autenticación JWT');
        userController.getUserById(req, res);
    }
);

export default router;