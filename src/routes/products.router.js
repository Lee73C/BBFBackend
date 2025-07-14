import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';

const router = Router();
const productManager = new ProductManager();

//Mostrar todos los productos
router.get("/", async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al obtener los productos", 
            error: error.message 
        });
    }
});

//Mostrar el producto por ID
router.get("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const products = await productManager.getProducts();
        const product = products.find(p => p.id === parseInt(pid));
        
        if (!product) {
            return res.status(404).json({ 
                status: "error", 
                message: `Producto con id: ${pid} no encontrado` 
            });
        }
        
        res.json({ status: "success", product });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al obtener el producto", 
            error: error.message 
        });
    }
});


router.post('/', async (req, res) => {
  try {

      const isAdmin = req.body.isAdmin === 'true' || req.headers['x-admin-mode'] === 'true';
      
      if (!isAdmin) {
          return res.status(403).render('realTimeProducts', { 
              title: 'Productos en Tiempo Real',
              products: await productManager.getProducts(),
              error: 'Solo los administradores pueden agregar productos'
          });
      }

      const { title, description, price, status, stock, category, thumbnails } = req.body;
      
      // Procesar thumbnails (convertir nombres de archivo a rutas completas)
      const thumbnailsArray = thumbnails ? 
          thumbnails.split(',')
              .map(filename => filename.trim())
              .filter(filename => filename)
              .map(filename => `/img/${filename}`) : 
          [];
      
      const newProduct = {
          title,
          description,
          price: parseInt(price),
          status: status === 'true',
          stock: parseInt(stock),
          category,
          thumbnails: thumbnailsArray
      };
      
      const addedProduct = await productManager.addProduct(newProduct);
      

      const io = req.app.get('io');
      const products = await productManager.getProducts();
      io.emit('updateProducts', products);
      
      // Obtener la lista actualizada y renderizar la misma vista
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: products,
          success: 'Producto agregado exitosamente'
      });
      
  } catch (error) {

      const products = await productManager.getProducts();
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: products,
          error: `Error al agregar producto: ${error.message}`
      });
  }
});

//Actualizar producto
router.put("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const updatedData = req.body;
        
        // Actualiza todo menos el ID y Code
        if (updatedData.id) {
            delete updatedData.id;
        }
        if (updatedData.code) {
            delete updatedData.code;
        }
        
        const products = await productManager.updateProductById(pid, updatedData);
        res.json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al actualizar el producto", 
            error: error.message 
        });
    }
});


router.post('/:pid/delete', async (req, res) => {
  try {

      const isAdmin = req.body.isAdmin === 'true' || req.headers['x-admin-mode'] === 'true';
      
      if (!isAdmin) {
          return res.status(403).render('realTimeProducts', { 
              title: 'Productos en Tiempo Real',
              products: await productManager.getProducts(),
              error: 'Solo los administradores pueden eliminar productos'
          });
      }

      const productId = req.params.pid;
      await productManager.deleteProductById(productId);
      

      const io = req.app.get('io');
      const products = await productManager.getProducts();
      io.emit('updateProducts', products);
      
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: products,
          success: 'Producto eliminado exitosamente'
      });
      
  } catch (error) {

      const products = await productManager.getProducts();
      res.render('realTimeProducts', { 
          title: 'Productos en Tiempo Real',
          products: products,
          error: `Error al eliminar producto: ${error.message}`
      });
  }
});


router.delete('/:pid', async (req, res) => {
  try {
      const productId = req.params.pid;
      await productManager.deleteProductById(productId);
      
      // EMITIR WEBSOCKET - Actualizar lista en tiempo real
      const io = req.app.get('io');
      const products = await productManager.getProducts();
      io.emit('updateProducts', products);
      
      res.json({
          status: "success",
          message: "Producto eliminado exitosamente"
      });
      
  } catch (error) {
      res.status(500).json({ 
          status: "error", 
          message: "Error al eliminar el producto", 
          error: error.message 
      });
  }
});

export default router;