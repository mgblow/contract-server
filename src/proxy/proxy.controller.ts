import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { PublishProxyDto } from './dto/publish-proxy.dto';
import { UpdateProxyDto } from './dto/update-proxy.dto';

@Controller('/api/v1')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}


  // post mappings
  @Post("")
  post(@Headers('token') token: string, @Body() publishProxyDto: PublishProxyDto) {
    return this.proxyService.publish(publishProxyDto, token);
  }

  @Get("")
  get(@Headers('token') token: string, @Body() publishProxyDto: PublishProxyDto) {
    return this.proxyService.publish(publishProxyDto, token);
  }
}
