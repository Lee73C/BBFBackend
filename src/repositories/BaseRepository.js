
class BaseRepository {
    constructor(dao) {
        if (!dao) {
            throw new Error('DAO es requerido para el Repository');
        }
        this.dao = dao;
    }

    /**
     * Crear un nuevo registro
     */
    async create(data) {
        try {
            return await this.dao.create(data);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar por ID
     */
    async findById(id, populate = null) {
        try {
            return await this.dao.findById(id, populate);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar uno por criterios
     */
    async findOne(criteria, populate = null) {
        try {
            return await this.dao.findOne(criteria, populate);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar múltiples por criterios
     */
    async find(criteria, options = {}) {
        try {
            return await this.dao.findBy(criteria, options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar por ID
     */
    async updateById(id, updateData) {
        try {
            return await this.dao.updateById(id, updateData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar por ID
     */
    async deleteById(id) {
        try {
            return await this.dao.deleteById(id);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Contar registros
     */
    async count(criteria = {}) {
        try {
            return await this.dao.count(criteria);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si existe
     */
    async exists(criteria) {
        try {
            return await this.dao.exists(criteria);
        } catch (error) {
            throw error;
        }
    }
}

export default BaseRepository;