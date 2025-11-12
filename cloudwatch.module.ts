import {Global, Module} from '@nestjs/common';
import {CloudwatchService} from '@microservices/cloudwatch/cloudwatch.service';

@Global()
@Module({
  controllers: [],
  providers: [CloudwatchService],
  exports: [CloudwatchService],
})
export class AwsCloudwatchModule {}
