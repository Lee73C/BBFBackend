
class CurrentUserDTO {
    constructor(user) {
        // Información básica del usuario
        this._id = user._id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.age = user.age;
        this.role = user.role;
        
        // Referencia al carrito (ID solamente)
        this.cart = user.cart;
        
        // Información adicional NO sensible
        this.full_name = `${user.first_name} ${user.last_name}`;
        
        // Timestamps (útiles para el frontend)
        if (user.createdAt) {
            this.account_created = user.createdAt;
        }
        
        if (user.updatedAt) {
            this.last_updated = user.updatedAt;
        }
        
        // Información del JWT si está disponible
        if (user.jwt_issued_at) {
            this.session = {
                issued_at: user.jwt_issued_at,
                expires_at: user.jwt_expires_at
            };
        }
    }

    /**
     * Método estático para crear DTO desde objeto de usuario
     */
    static fromUser(user) {
        if (!user) return null;
        return new CurrentUserDTO(user);
    }

    /**
     * Método para obtener objeto plano (sin métodos)
     */
    toPlainObject() {
        return {
            _id: this._id,
            first_name: this.first_name,
            last_name: this.last_name,
            email: this.email,
            age: this.age,
            role: this.role,
            cart: this.cart,
            full_name: this.full_name,
            account_created: this.account_created,
            last_updated: this.last_updated,
            session: this.session
        };
    }
}

export default CurrentUserDTO;