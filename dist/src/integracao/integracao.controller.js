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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegracaoController = void 0;
const common_1 = require("@nestjs/common");
const integracao_service_js_1 = require("./integracao.service.js");
const create_pedido_dto_js_1 = require("./dto/create-pedido.dto.js");
const create_documento_dto_js_1 = require("./dto/create-documento.dto.js");
const create_exame_dto_js_1 = require("./dto/create-exame.dto.js");
let IntegracaoController = class IntegracaoController {
    integracaoService;
    constructor(integracaoService) {
        this.integracaoService = integracaoService;
    }
    async createPedido(dto) {
        return this.integracaoService.createPedido(dto);
    }
    async findPedido(codigoPedido) {
        return this.integracaoService.findPedido(codigoPedido);
    }
    async createDocumento(dto) {
        return this.integracaoService.createDocumento(dto);
    }
    async findDocumentos(codigoPedido) {
        return this.integracaoService.findDocumentos(codigoPedido);
    }
    async upsertExame(dto) {
        return this.integracaoService.upsertExame(dto);
    }
    async findExame(accessionNumber) {
        return this.integracaoService.findExame(accessionNumber);
    }
};
exports.IntegracaoController = IntegracaoController;
__decorate([
    (0, common_1.Post)('pedidos'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pedido_dto_js_1.CreatePedidoDto]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "createPedido", null);
__decorate([
    (0, common_1.Get)('pedidos/:codigoPedido'),
    __param(0, (0, common_1.Param)('codigoPedido', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "findPedido", null);
__decorate([
    (0, common_1.Post)('documentos'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_documento_dto_js_1.CreateDocumentoDto]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "createDocumento", null);
__decorate([
    (0, common_1.Get)('documentos/:codigoPedido'),
    __param(0, (0, common_1.Param)('codigoPedido', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "findDocumentos", null);
__decorate([
    (0, common_1.Post)('exames'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exame_dto_js_1.CreateExameDto]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "upsertExame", null);
__decorate([
    (0, common_1.Get)('exames/:accessionNumber'),
    __param(0, (0, common_1.Param)('accessionNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntegracaoController.prototype, "findExame", null);
exports.IntegracaoController = IntegracaoController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [integracao_service_js_1.IntegracaoService])
], IntegracaoController);
//# sourceMappingURL=integracao.controller.js.map