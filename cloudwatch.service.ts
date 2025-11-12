import {Injectable} from '@nestjs/common';
import {CloudWatchClient, GetMetricStatisticsCommand} from '@aws-sdk/client-cloudwatch';
import {
  CloudwatchMetricDiskMetricName,
  CloudwatchMetricMemoryMetricName,
  CloudwatchMetricStatistics,
  CloudwatchMetricUnit,
} from '@microservices/cloudwatch/cloudwatch.enum';

@Injectable()
export class CloudwatchService {
  private initClient(args: {awsKey?: string; awsSecret?: string; region: string}) {
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
    statistics: CloudwatchMetricStatistics;
  }) {
    const {awsKey, awsSecret, region, instanceId, startTime, endTime, period, statistics} = args;
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

  async getEC2MemoryMetric(args: {
    awsKey?: string;
    awsSecret?: string;
    metricName: CloudwatchMetricMemoryMetricName;
    region: string;
    instanceId: string;
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: CloudwatchMetricStatistics;
    unit: CloudwatchMetricUnit;
  }) {
    const {awsKey, awsSecret, metricName, region, instanceId, startTime, endTime, period, statistics, unit} = args;
    const client = this.initClient({
      awsKey,
      awsSecret,
      region,
    });
    const command = new GetMetricStatisticsCommand({
      Namespace: 'CWAgent',
      MetricName: metricName,
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
      Unit: unit,
    });
    return await client.send(command);
  }

  async getEC2DiskMetric(args: {
    awsKey?: string;
    awsSecret?: string;
    metricName: CloudwatchMetricDiskMetricName;
    region: string;
    instanceId: string;
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: CloudwatchMetricStatistics;
  }) {
    const {awsKey, awsSecret, metricName, region, instanceId, startTime, endTime, period, statistics} = args;
    const client = this.initClient({
      awsKey,
      awsSecret,
      region,
    });
    const command = new GetMetricStatisticsCommand({
      Namespace: 'CWAgent',
      MetricName: metricName,
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
