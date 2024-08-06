import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { AuthGuard } from '~/auth/auth.guard';
import { CheckoutOrderDto } from './dto/product.dto';
import { APIException } from '~/api.excetion';
import { Local } from '~/decorator';
import { JwtMember } from '~/auth/auth.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService, private readonly logger: Logger) {}

  @Post('checkout-order')
  @UseGuards(AuthGuard)
  async checkoutOrder(@Body() checkoutOrderDto: CheckoutOrderDto, @Req() req, @Local('member') member: JwtMember) {
    try {
      const { orderProducts, orderDiscounts } = await this.productService.checkoutOrder(checkoutOrderDto);

      return {
        code: 'SUCCESS',
        message: 'checkout order successfully',
        result: {
          orderProducts,
          orderDiscounts,
          // shippingOption,
        },
      };
    } catch (error) {
      this.logger.log({
        error,
        appId: checkoutOrderDto.appId,
        title: 'E_CHECKOUT_ORDER',
        message: error.message,
      });
      throw new APIException({
        code: 'E_CHECKOUT_ORDER',
        message: error.message,
        result: null,
      });
    }
  }
}
