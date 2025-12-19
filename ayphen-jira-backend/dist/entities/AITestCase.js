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
exports.AITestCase = void 0;
const typeorm_1 = require("typeorm");
const AIStory_1 = require("./AIStory");
const Issue_1 = require("./Issue");
let AITestCase = class AITestCase {
};
exports.AITestCase = AITestCase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AITestCase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true, length: 50 }),
    __metadata("design:type", String)
], AITestCase.prototype, "testCaseKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "requirementId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], AITestCase.prototype, "suiteKey", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AIStory_1.AIStory, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'storyId' }),
    __metadata("design:type", AIStory_1.AIStory)
], AITestCase.prototype, "story", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "storyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Issue_1.Issue, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", Issue_1.Issue)
], AITestCase.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], AITestCase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AITestCase.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AITestCase.prototype, "automated", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], AITestCase.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "expectedResult", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], AITestCase.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AITestCase.prototype, "suiteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'active', length: 50 }),
    __metadata("design:type", String)
], AITestCase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AITestCase.prototype, "flagged", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AITestCase.prototype, "createdAt", void 0);
exports.AITestCase = AITestCase = __decorate([
    (0, typeorm_1.Entity)('ai_test_cases')
], AITestCase);
