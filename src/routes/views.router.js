import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager();

//Ruta Raíz - Home
router.get('/', async (req, res) => {
  try {
      const products = await productManager.getProducts();
      res.render('home', { 
          title: 'Inicio',
          products: products 
      });
  } catch (error) {
      res.render('home', { 
          title: 'Inicio',
          products: [],
          error: 'Error al cargar productos'
      });
  }
});

// Ruta para realTimeProducts.handlebars
router.get('/realtimeproducts', async (req, res) => {
  try {
      const products = await productManager.getProducts();
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: products 
      });
  } catch (error) {
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: [],
          error: 'Error al cargar productos'
      });
  }
});

export default router;