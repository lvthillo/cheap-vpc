import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { BastionHostLinux, VpcEndpoint, Vpc } from 'aws-cdk-lib/aws-ec2'
import { FckNatInstanceProvider } from 'cdk-fck-nat'

export class CheapVpcStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const fckNatProvider = new FckNatInstanceProvider({
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.NANO
      ),
    })

    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.0.0.0/16',
      natGatewayProvider: fckNatProvider,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    })

    vpc.addGatewayEndpoint('s3-endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    })

    vpc.addGatewayEndpoint('ddb-endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    })

    cdk.Aspects.of(vpc).add(new cdk.Tag('Name', 'cdk-vpc'))

    for (const subnet of vpc.privateSubnets) {
      fckNatProvider.securityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(443),
        'Allow HTTPS'
      )

      fckNatProvider.securityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(80),
        'Allow HTTP'
      )

      fckNatProvider.securityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.udpRange(33434, 33534),
        'Allow Traceroute'
      )

      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${
            subnet.availabilityZone
          }`
        )
      )
    }

    for (const subnet of vpc.publicSubnets) {
      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${
            subnet.availabilityZone
          }`
        )
      )
    }

    const host = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      requireImdsv2: true,
      instanceName: 'bastion-host-linux',
    })

    new cdk.CfnOutput(this, 'vpcId', {
      value: vpc.vpcId,
      description: 'the ID of the VPC',
    })
    new cdk.CfnOutput(this, 'bastion-ip', {
      value: host.instancePrivateIp,
      description: 'the private ip of the bastion host',
    })
  }
}
