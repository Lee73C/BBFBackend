import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  try {
    // Evitar múltiples conexiones
    if (isConnected) {
      return;
    }

    // Verificar si ya hay una conexión activa
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return;
    }
    
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    // Opciones de conexión optimizadas
    const options = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
    };
    
    // Conectar a MongoDB
    await mongoose.connect(uri, options);
    
    // Verificar conexión
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
    } else {
      throw new Error('Conexión no está en estado listo');
    }
    
    // Event listeners (solo una vez)
    if (!mongoose.connection._eventsSet) {
      mongoose.connection.on('error', (error) => {
        console.error('Error de conexión MongoDB:', error);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        isConnected = false;
      });
      
      mongoose.connection.on('reconnected', () => {
        isConnected = true;
      });
      
      mongoose.connection.on('connected', () => {
        isConnected = true;
      });
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          isConnected = false;
        } catch (error) {
          console.error('Error cerrando conexión:', error);
        }
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        try {
          await mongoose.connection.close();
          isConnected = false;
        } catch (error) {
          console.error('Error cerrando conexión:', error);
        }
        process.exit(0);
      });
      
      mongoose.connection._eventsSet = true;
    }
    
    // Verificar la conexión con ping
    await mongoose.connection.db.admin().ping();
    
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    isConnected = false;
    
    if (process.env.NODE_ENV === 'development') {
      // No lanzar error en desarrollo
    } else {
      throw error;
    }
  }
};

// Función para esperar a que la conexión esté lista
export const waitForConnection = async (maxWaitTime = 15000) => {
  const startTime = Date.now();
  
  while (!isConnected && mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Timeout esperando conexión a MongoDB');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return true;
};

// Función para verificar estado de conexión
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name,
    states: {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    }
  };
};

// Función para cerrar conexión manualmente
export const closeConnection = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
  }
};

export default connectDB;