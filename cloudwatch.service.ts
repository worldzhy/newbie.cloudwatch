import {Injectable} from '@nestjs/common';
import {CloudWatchClient, GetMetricDataCommand} from '@aws-sdk/client-cloudwatch';
import {CloudwatchMetricRDSMetricName, CloudwatchMetricStatistics} from '@microservices/cloudwatch/cloudwatch.enum';
import {DescribeInstancesCommand, EC2Client} from '@aws-sdk/client-ec2';
import {DescribeDBInstancesCommand, RDSClient} from '@aws-sdk/client-rds';
import {isArray} from 'class-validator';

@Injectable()
export class CloudwatchService {
  private initCloudwatchClient(args: {awsKey?: string; awsSecret?: string; region: string}) {
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

  private initEC2Client(args: {awsKey?: string; awsSecret?: string; region: string}) {
    const {awsKey, awsSecret, region} = args;
    let client: EC2Client;
    if (awsKey && awsSecret) {
      client = new EC2Client({
        region,
        credentials: {
          accessKeyId: awsKey,
          secretAccessKey: awsSecret,
        },
      });
    } else {
      client = new EC2Client({
        region,
      });
    }
    return client;
  }

  private initRDSClient(args: {awsKey?: string; awsSecret?: string; region: string}) {
    const {awsKey, awsSecret, region} = args;
    let client: RDSClient;
    if (awsKey && awsSecret) {
      client = new RDSClient({
        region,
        credentials: {
          accessKeyId: awsKey,
          secretAccessKey: awsSecret,
        },
      });
    } else {
      client = new RDSClient({
        region,
      });
    }
    return client;
  }

  async getEC2InstancesCPUMetric(args: {
    ec2InstanceIds?: string[];
    awsKey?: string;
    awsSecret?: string;
    region: string;
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: CloudwatchMetricStatistics;
  }) {
    const {ec2InstanceIds, awsKey, awsSecret, region, startTime, endTime, period, statistics} = args;
    const ec2Client = this.initEC2Client({
      awsKey,
      awsSecret,
      region,
    });
    const cloudwatchClient = this.initCloudwatchClient({
      awsKey,
      awsSecret,
      region,
    });
    let ids: string[] = [];
    if (!isArray(ec2InstanceIds) || ec2InstanceIds.length === 0) {
      // List all ec2 instances.
      const listCommand = new DescribeInstancesCommand({
        MaxResults: 1000,
      });
      const ec2Response = await ec2Client.send(listCommand);
      if (ec2Response.Reservations) {
        for (const reservation of ec2Response.Reservations) {
          if (reservation.Instances) {
            for (const inst of reservation.Instances) {
              if (inst.InstanceId) {
                ids.push(inst.InstanceId);
              }
            }
          }
        }
      }
    } else {
      ids = [...ec2InstanceIds];
    }
    if (ids.length) {
      const queries = ids.map((id, idx) => ({
        Id: `cpu${idx}`,
        MetricStat: {
          Metric: {
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Dimensions: [
              {
                Name: 'InstanceId',
                Value: id,
              },
            ],
          },
          Period: period,
          Stat: statistics,
        },
        ReturnData: true,
      }));
      const command = new GetMetricDataCommand({
        StartTime: startTime,
        EndTime: endTime,
        MetricDataQueries: queries,
      });
      return await cloudwatchClient.send(command);
    }
    return null;
  }

  async getRDSInstancesMetric(args: {
    rdsInstanceIds?: string[];
    awsKey?: string;
    awsSecret?: string;
    metricName: CloudwatchMetricRDSMetricName;
    region: string;
    instanceId: string;
    startTime: Date;
    endTime: Date;
    period: number;
    statistics: CloudwatchMetricStatistics;
  }) {
    const {rdsInstanceIds, awsKey, awsSecret, metricName, region, instanceId, startTime, endTime, period, statistics} =
      args;
    const rdsClient = this.initEC2Client({
      awsKey,
      awsSecret,
      region,
    });
    const cloudwatchClient = this.initCloudwatchClient({
      awsKey,
      awsSecret,
      region,
    });
    let ids: string[] = [];
    if (!isArray(rdsInstanceIds) || rdsInstanceIds.length === 0) {
      // List all rds instances.
      const listCommand = new DescribeDBInstancesCommand({
        MaxRecords: 100,
      });
      const rdsResponse = await rdsClient.send(listCommand);
      if (rdsResponse.DBInstances) {
        for (const inst of rdsResponse.DBInstances) {
          if (inst.DBInstanceIdentifier) {
            ids.push(inst.DBInstanceIdentifier);
          }
        }
      }
    } else {
      ids = [...rdsInstanceIds];
    }
    const queries = ids.map((id, index) => ({
      Id: `q${index}`, // 每个查询要有唯一 Id
      MetricStat: {
        Metric: {
          Namespace: 'AWS/RDS',
          MetricName: metricName,
          Dimensions: [{Name: 'DBInstanceIdentifier', Value: id}],
        },
        Period: period,
        Stat: statistics,
      },
    }));
    const command = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: queries,
    });
    return await cloudwatchClient.send(command);
  }
}
