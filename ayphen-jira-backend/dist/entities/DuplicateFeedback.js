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
exports.DuplicateFeedback = void 0;
const typeorm_1 = require("typeorm");
const Issue_1 = require("./Issue");
const User_1 = require("./User");
let DuplicateFeedback = class DuplicateFeedback {
};
exports.DuplicateFeedback = DuplicateFeedback;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DuplicateFeedback.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issue_id' }),
    __metadata("design:type", String)
], DuplicateFeedback.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Issue_1.Issue, { nullable: true }),
    __metadata("design:type", Issue_1.Issue)
], DuplicateFeedback.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'suggested_duplicate_id' }),
    __metadata("design:type", String)
], DuplicateFeedback.prototype, "suggestedDuplicateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Issue_1.Issue, { nullable: true }),
    __metadata("design:type", Issue_1.Issue)
], DuplicateFeedback.prototype, "suggestedDuplicate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'ai_confidence' }),
    __metadata("design:type", Number)
], DuplicateFeedback.prototype, "aiConfidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, name: 'user_action' }),
    __metadata("design:type", String)
], DuplicateFeedback.prototype, "userAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'was_correct' }),
    __metadata("design:type", Boolean)
], DuplicateFeedback.prototype, "wasCorrect", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], DuplicateFeedback.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], DuplicateFeedback.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DuplicateFeedback.prototype, "createdAt", void 0);
exports.DuplicateFeedback = DuplicateFeedback = __decorate([
    (0, typeorm_1.Entity)('duplicate_feedback')
], DuplicateFeedback);
