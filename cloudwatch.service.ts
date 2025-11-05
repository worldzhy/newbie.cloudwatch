import {Injectable} from '@nestjs/common';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

@Injectable()
export class CloudwatchService {
  private initClient(args: {
    awsKey?: string;
    awsSecret?: string;
    region: string;
  }) {
    const {awsKey, awsSecret, region} = args;
    let client: CloudWatchClient;
    if (awsKey && awsSecret) {
      client = new CloudWatchClient({
        region,
        credentials: {
          accessKeyId: awsKey,
          secretAccessKey: awsSecret,
        },
      });
    } else {
      client = new CloudWatchClient({
        region,
      });
    }
    return client;
  }

  async getEC2CPUMetric(args: {
    awsKey?: string;
    awsSecret?: string;
    region: string;
    instanceId: string;
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: 'Average' | 'Minimum' | 'Maximum' | 'Sum' | 'SampleCount';
  }) {
    const {
      awsKey,
      awsSecret,
      region,
      instanceId,
      startTime,
      endTime,
      period,
      statistics,
    } = args;
    const client = this.initClient({
      awsKey,
      awsSecret,
      region,
    });
    const command = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId,
        },
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: period,
      Statistics: [statistics],
    });
    return await client.send(command);
  }
}
