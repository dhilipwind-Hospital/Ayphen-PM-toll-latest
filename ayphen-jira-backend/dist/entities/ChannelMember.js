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
exports.ChannelMember = void 0;
const typeorm_1 = require("typeorm");
const ChatChannel_1 = require("./ChatChannel");
const User_1 = require("./User");
let ChannelMember = class ChannelMember {
};
exports.ChannelMember = ChannelMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChannelMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChannelMember.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChannelMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'member'
    }),
    __metadata("design:type", String)
], ChannelMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChannelMember.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ChannelMember.prototype, "lastReadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ChannelMember.prototype, "notificationSettings", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ChatChannel_1.ChatChannel, channel => channel.members),
    (0, typeorm_1.JoinColumn)({ name: 'channelId' }),
    __metadata("design:type", ChatChannel_1.ChatChannel)
], ChannelMember.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], ChannelMember.prototype, "user", void 0);
exports.ChannelMember = ChannelMember = __decorate([
    (0, typeorm_1.Entity)('channel_members')
], ChannelMember);
