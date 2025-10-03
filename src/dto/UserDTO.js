
class UserDTO {
    constructor(user) {
        this._id = user._id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.age = user.age;
        this.role = user.role;
        this.cart = user.cart;
        
        // Información adicional NO sensible
        this.full_name = `${user.first_name} ${user.last_name}`;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    /**
     * Método estático para crear DTO desde objeto de usuario
     */
    static fromUser(user) {
        if (!user) return null;
        return new UserDTO(user);
    }

    /**
     * Método estático para crear DTOs desde un array de usuarios
     */
    static fromUsers(users) {
        if (!users || !Array.isArray(users)) return [];
        return users.map(user => new UserDTO(user));
    }
}

export default UserDTO;