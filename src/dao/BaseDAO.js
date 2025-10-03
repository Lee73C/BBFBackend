import mongoose from 'mongoose';

class BaseDAO {
    constructor(model) {
        if (!model) {
            throw new Error('Modelo de MongoDB es requerido');
        }
        this.model = model;
        this.modelName = model.modelName || 'Unknown';
    }

    // Verificar conexión antes de cualquier operación
    async _ensureConnection() {
        if (mongoose.connection.readyState !== 1) {
            throw new Error(`Base de datos no está conectada. Estado: ${
                ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
            }`);
        }
    }

    // Crear nuevo documento
    async create(data) {
        try {
            await this._ensureConnection();
            
            const document = new this.model(data);
            const saved = await document.save();
            
            return saved;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                throw new Error(`Errores de validación: ${errors.join(', ')}`);
            }
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new Error(`Ya existe un documento con ese ${field}`);
            }
            throw new Error(`Error al crear ${this.modelName}: ${error.message}`);
        }
    }

    // Buscar por ID
    async findById(id, populate = null) {
        try {
            await this._ensureConnection();
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`ID inválido: ${id}`);
            }
            
            let query = this.model.findById(id);
            if (populate) {
                query = query.populate(populate);
            }
            
            const document = await query.exec();
            
            if (!document) {
                throw new Error(`${this.modelName} con ID ${id} no encontrado`);
            }
            
            return document;
        } catch (error) {
            throw error;
        }
    }

    // Buscar un documento con criterios
    async findOne(criteria, populate = null) {
        try {
            await this._ensureConnection();
            
            let query = this.model.findOne(criteria);
            if (populate) {
                query = query.populate(populate);
            }
            
            const document = await query.exec();
            return document;
        } catch (error) {
            throw new Error(`Error al buscar ${this.modelName}: ${error.message}`);
        }
    }

    // Actualizar por ID
    async updateById(id, updateData) {
        try {
            await this._ensureConnection();
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`ID inválido: ${id}`);
            }
            
            const updated = await this.model.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (!updated) {
                throw new Error(`${this.modelName} con ID ${id} no encontrado`);
            }
            
            return updated;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar por ID
    async deleteById(id) {
        try {
            await this._ensureConnection();
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`ID inválido: ${id}`);
            }
            
            const deleted = await this.model.findByIdAndDelete(id);
            
            if (!deleted) {
                throw new Error(`${this.modelName} con ID ${id} no encontrado`);
            }
            
            return deleted;
        } catch (error) {
            throw error;
        }
    }
}

export default BaseDAO;