"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRun = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const AITestSuite_1 = require("./AITestSuite");
let TestRun = class TestRun {
};
exports.TestRun = TestRun;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestRun.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], TestRun.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestRun.prototype, "suiteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AITestSuite_1.AITestSuite, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'suiteId' }),
    __metadata("design:type", AITestSuite_1.AITestSuite)
], TestRun.prototype, "suite", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestRun.prototype, "cycleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'dev' }),
    __metadata("design:type", String)
], TestRun.prototype, "environment", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'chrome' }),
    __metadata("design:type", String)
], TestRun.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'running' }),
    __metadata("design:type", String)
], TestRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TestRun.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TestRun.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestRun.prototype, "executedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'executedBy' }),
    __metadata("design:type", User_1.User)
], TestRun.prototype, "executor", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TestRun.prototype, "totalTests", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TestRun.prototype, "passed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TestRun.prototype, "failed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TestRun.prototype, "skipped", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TestRun.prototype, "blocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], TestRun.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestRun.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], TestRun.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TestRun.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TestRun.prototype, "updatedAt", void 0);
exports.TestRun = TestRun = __decorate([
    (0, typeorm_1.Entity)('test_runs')
], TestRun);
