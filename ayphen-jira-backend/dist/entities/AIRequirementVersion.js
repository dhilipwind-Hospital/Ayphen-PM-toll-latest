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
exports.AIRequirementVersion = void 0;
const typeorm_1 = require("typeorm");
const AIRequirement_1 = require("./AIRequirement");
let AIRequirementVersion = class AIRequirementVersion {
};
exports.AIRequirementVersion = AIRequirementVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AIRequirementVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AIRequirement_1.AIRequirement),
    (0, typeorm_1.JoinColumn)({ name: 'requirementId' }),
    __metadata("design:type", AIRequirement_1.AIRequirement)
], AIRequirementVersion.prototype, "requirement", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AIRequirementVersion.prototype, "requirementId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AIRequirementVersion.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], AIRequirementVersion.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], AIRequirementVersion.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AIRequirementVersion.prototype, "createdAt", void 0);
exports.AIRequirementVersion = AIRequirementVersion = __decorate([
    (0, typeorm_1.Entity)('ai_requirement_versions')
], AIRequirementVersion);
