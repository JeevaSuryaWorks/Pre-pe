import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { AdminEcommerceController } from './admin-ecommerce.controller';
import { AdminEcommerceService } from './admin-ecommerce.service';

@Module({
    imports: [],
    controllers: [
        ProductsController,
        CartController,
        OrdersController,
        SellersController,
        AdminEcommerceController
    ],
    providers: [
        ProductsService,
        CartService,
        OrdersService,
        SellersService,
        AdminEcommerceService
    ],
    exports: [
        ProductsService,
        CartService,
        OrdersService,
        SellersService,
        AdminEcommerceService
    ]
})
export class EcommerceModule {}
