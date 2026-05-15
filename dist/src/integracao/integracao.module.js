"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegracaoModule = void 0;
const common_1 = require("@nestjs/common");
const integracao_controller_js_1 = require("./integracao.controller.js");
const integracao_service_js_1 = require("./integracao.service.js");
let IntegracaoModule = class IntegracaoModule {
};
exports.IntegracaoModule = IntegracaoModule;
exports.IntegracaoModule = IntegracaoModule = __decorate([
    (0, common_1.Module)({
        controllers: [integracao_controller_js_1.IntegracaoController],
        providers: [integracao_service_js_1.IntegracaoService],
    })
], IntegracaoModule);
//# sourceMappingURL=integracao.module.js.map