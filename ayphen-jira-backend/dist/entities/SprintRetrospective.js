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
exports.SprintRetrospective = void 0;
const typeorm_1 = require("typeorm");
const Sprint_1 = require("./Sprint");
const User_1 = require("./User");
let SprintRetrospective = class SprintRetrospective {
};
exports.SprintRetrospective = SprintRetrospective;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SprintRetrospective.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SprintRetrospective.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Sprint_1.Sprint),
    (0, typeorm_1.JoinColumn)({ name: 'sprintId' }),
    __metadata("design:type", Sprint_1.Sprint)
], SprintRetrospective.prototype, "sprint", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json'),
    __metadata("design:type", Array)
], SprintRetrospective.prototype, "wentWell", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json'),
    __metadata("design:type", Array)
], SprintRetrospective.prototype, "improvements", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json'),
    __metadata("design:type", Array)
], SprintRetrospective.prototype, "actionItems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SprintRetrospective.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SprintRetrospective.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", User_1.User)
], SprintRetrospective.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SprintRetrospective.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SprintRetrospective.prototype, "updatedAt", void 0);
exports.SprintRetrospective = SprintRetrospective = __decorate([
    (0, typeorm_1.Entity)('sprint_retrospectives')
], SprintRetrospective);
