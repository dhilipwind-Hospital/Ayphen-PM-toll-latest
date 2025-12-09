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
exports.TestDefectLink = void 0;
const typeorm_1 = require("typeorm");
const TestResult_1 = require("./TestResult");
const Issue_1 = require("./Issue");
let TestDefectLink = class TestDefectLink {
};
exports.TestDefectLink = TestDefectLink;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestDefectLink.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TestDefectLink.prototype, "testResultId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TestResult_1.TestResult),
    (0, typeorm_1.JoinColumn)({ name: 'testResultId' }),
    __metadata("design:type", TestResult_1.TestResult)
], TestDefectLink.prototype, "testResult", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TestDefectLink.prototype, "defectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Issue_1.Issue),
    (0, typeorm_1.JoinColumn)({ name: 'defectId' }),
    __metadata("design:type", Issue_1.Issue)
], TestDefectLink.prototype, "defect", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'relates-to' }),
    __metadata("design:type", String)
], TestDefectLink.prototype, "linkType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TestDefectLink.prototype, "autoCreated", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], TestDefectLink.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TestDefectLink.prototype, "createdAt", void 0);
exports.TestDefectLink = TestDefectLink = __decorate([
    (0, typeorm_1.Entity)('test_defect_links')
], TestDefectLink);
