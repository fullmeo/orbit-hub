class AuthService {
    async login(email, password) {
        const user = await db.findUser(email);
        if (!user) return null;
        const token = await this.generateJWT({ id: user.id, email });
        return { token };
    }
    async generateJWT(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET);
    }
}
