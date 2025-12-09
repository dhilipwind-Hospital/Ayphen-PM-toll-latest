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
exports.AITestSuite = void 0;
const typeorm_1 = require("typeorm");
const AIRequirement_1 = require("./AIRequirement");
let AITestSuite = class AITestSuite {
};
exports.AITestSuite = AITestSuite;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AITestSuite.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true, length: 50 }),
    __metadata("design:type", String)
], AITestSuite.prototype, "suiteKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestSuite.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], AITestSuite.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], AITestSuite.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AITestSuite.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { default: '' }),
    __metadata("design:type", Array)
], AITestSuite.prototype, "testCaseKeys", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AIRequirement_1.AIRequirement),
    (0, typeorm_1.JoinColumn)({ name: 'requirementId' }),
    __metadata("design:type", AIRequirement_1.AIRequirement)
], AITestSuite.prototype, "requirement", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AITestSuite.prototype, "requirementId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], AITestSuite.prototype, "testCaseCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AITestSuite.prototype, "createdAt", void 0);
exports.AITestSuite = AITestSuite = __decorate([
    (0, typeorm_1.Entity)('ai_test_suites')
], AITestSuite);
