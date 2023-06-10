import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { PublishProxyDto } from './dto/publish-proxy.dto';
import { UpdateProxyDto } from './dto/update-proxy.dto';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post()
  create(@Body() publishProxyDto: PublishProxyDto) {
    return this.proxyService.publish(publishProxyDto);
  }
  
}
