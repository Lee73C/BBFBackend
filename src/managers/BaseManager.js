import fs from "fs";
import path from "path";

class BaseManager {
    constructor(fileName) {

        this.pathFile = path.join(process.cwd(), 'src', 'data', fileName);
    }

    // Generador de ID genérico
    generateNewId(items) {
        if (items.length > 0) {
            return items[items.length - 1].id + 1;
        } else {
            return 1;
        }
    }

    // Leer datos del archivo
    async readData() {
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            return JSON.parse(fileData);
        } catch (error) {
            // Si el archivo no existe, retorna array vacío
            return [];
        }
    }

    // Escribir datos al archivo
    async writeData(data) {
        try {
            await fs.promises.writeFile(this.pathFile, JSON.stringify(data, null, 2), "utf-8");
            return data;
        } catch (error) {
            throw new Error(`Error al escribir en el archivo: ${error.message}`);
        }
    }

    // Buscar item por ID
    async getById(id) {
        try {
            const data = await this.readData();
            const item = data.find(item => item.id === parseInt(id));
            
            if (!item) {
                throw new Error(`Item con id: ${id} no encontrado`);
            }
            
            return item;
        } catch (error) {
            throw new Error(`Error al obtener el item: ${error.message}`);
        }
    }

    // Obtener todos los items
    async getAll() {
        try {
            return await this.readData();
        } catch (error) {
            throw new Error("Error al cargar los datos");
        }
    }

    // Eliminar item por ID
    async deleteById(id) {
        try {
            const data = await this.readData();
            const itemIndex = data.findIndex(item => item.id === parseInt(id));

            if (itemIndex === -1) {
                throw new Error(`Item con id: ${id} no encontrado`);
            }
            
            data.splice(itemIndex, 1);
            await this.writeData(data);
            return data;
        } catch (error) {
            throw new Error(`Error al eliminar el item: ${error.message}`);
        }
    }

    // Actualizar item por ID
    async updateById(id, updatedItem) {
        try {
            const data = await this.readData();
            const itemIndex = data.findIndex(item => item.id === parseInt(id));
            
            if (itemIndex === -1) {
                throw new Error(`Item con id: ${id} no encontrado`);
            }

            data[itemIndex] = { ...data[itemIndex], ...updatedItem };
            await this.writeData(data);
            return data;
        } catch (error) {
            throw new Error(`Error al actualizar el item: ${error.message}`);
        }
    }

    // Agregar nuevo item
    async add(newItem) {
        try {
            const data = await this.readData();
            const newId = this.generateNewId(data);
            
            const item = {
                id: newId,
                ...newItem
            };
            
            data.push(item);
            await this.writeData(data);
            return item;
        } catch (error) {
            throw new Error(`Error al agregar el nuevo item: ${error.message}`);
        }
    }
}

export default BaseManager;