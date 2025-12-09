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
exports.IssueWatcher = void 0;
const typeorm_1 = require("typeorm");
const Issue_1 = require("./Issue");
const User_1 = require("./User");
let IssueWatcher = class IssueWatcher {
};
exports.IssueWatcher = IssueWatcher;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IssueWatcher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueWatcher.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Issue_1.Issue, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", Issue_1.Issue)
], IssueWatcher.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueWatcher.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], IssueWatcher.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IssueWatcher.prototype, "watchedAt", void 0);
exports.IssueWatcher = IssueWatcher = __decorate([
    (0, typeorm_1.Entity)('issue_watchers')
], IssueWatcher);
