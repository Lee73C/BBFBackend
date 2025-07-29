import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  try {
    // Evitar múltiples conexiones
    if (isConnected) {
      console.log('🔄 Usando conexión existente a MongoDB');
      return;
    }

    // ✅ Verificar si ya hay una conexión activa
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB ya está conectado');
      isConnected = true;
      return;
    }

    console.log('🚀 Iniciando conexión a MongoDB...');
    
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    // Ocultar la contraseña para el log
    const safeUri = uri.replace(/:([^:@]+)@/, ':***@');
    console.log('🌐 URI (sin contraseña):', safeUri);
    
    console.log('⏳ Intentando conectar...');
    
    // Opciones corregidas para desarrollo
    const options = {
      serverSelectionTimeoutMS: 10000, 
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
    };
    
    // ESPERAR a que la conexión esté completamente lista
    await mongoose.connect(uri, options);
    
    // Verificar que la conexión esté realmente lista
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      console.log('✅ MongoDB Atlas conectado correctamente');
    } else {
      throw new Error('Conexión no está en estado listo');
    }
    
    // Event listeners optimizados (solo una vez)
    if (!mongoose.connection._eventsSet) {
      mongoose.connection.on('error', (error) => {
        console.error('❌ Error de conexión MongoDB:', error);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB desconectado');
        isConnected = false;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconectado');
        isConnected = true;
      });
      
      mongoose.connection.on('connected', () => {
        console.log('🔗 MongoDB conectado');
        isConnected = true;
      });
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('🛑 Cerrando conexión a MongoDB...');
        try {
          await mongoose.connection.close();
          isConnected = false;
          console.log('✅ Conexión cerrada correctamente');
        } catch (error) {
          console.error('❌ Error cerrando conexión:', error);
        }
        process.exit(0);
      });
      
      // Marcar eventos como configurados
      mongoose.connection._eventsSet = true;
    }
    
  } catch (error) {
    console.error('💥 Error conectando a MongoDB:', error.message);
    isConnected = false;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuando sin conexión a base de datos en desarrollo...');
      // No lanzar error en desarrollo
    } else {
      throw error; // En producción, fallar si no hay conexión
    }
  }
};

// Función para esperar a que la conexión esté lista
export const waitForConnection = async (maxWaitTime = 10000) => {
  const startTime = Date.now();
  
  while (!isConnected && mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Timeout esperando conexión a MongoDB');
    }
    
    console.log('⏳ Esperando conexión a MongoDB...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return true;
};

// Función para verificar estado de conexión
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
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
    console.log('🔴 Conexión MongoDB cerrada manualmente');
  }
};

export default connectDB;