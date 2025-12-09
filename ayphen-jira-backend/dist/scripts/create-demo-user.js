"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function createDemoUser() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Check if demo user exists
        const existing = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
        if (existing) {
            console.log('ℹ️  Demo user already exists');
            process.exit(0);
        }
        // Create demo user with hashed password
        const hashedPassword = await bcrypt_1.default.hash('demo123', 10);
        const user = userRepo.create({
            name: 'Demo User',
            email: 'demo@demo.com',
            password: hashedPassword,
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=1890ff&color=fff',
        });
        await userRepo.save(user);
        console.log('✅ Demo user created');
        console.log('   Email: demo@demo.com');
        console.log('   Password: demo123');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}
createDemoUser();
