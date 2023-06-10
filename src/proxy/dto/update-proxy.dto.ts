import { PartialType } from '@nestjs/mapped-types';
import { PublishProxyDto } from './publish-proxy.dto';

export class UpdateProxyDto extends PartialType(PublishProxyDto) {}
