# The Cheap VPC Stack

This example can be used to deploy a VPC using [fck-nat](https://github.com/AndrewGuenther/fck-nat).
The advantages of cdk-fck-nat are described in the [README.md](https://github.com/AndrewGuenther/fck-nat/blob/main/README.md).

## Architecture
It will deploy a VPC with 4 subnets in 2 AZ's. It will deploy a `fck-nat` instance in each of the public subnets.
The stack will also include an Internet Gateway, correct routing, VPC gateway endpoints (s3 and DynamoDB) and a bastion host. The bastion host is deployed without SSH key and in a private subnet, but can be reached using [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html).

Inbound traffic from our private subnets on port `80` and `443` are allowed in the `fck-nat` security group.
Also UDP range `33434 - 33534` is allowed to use traceroute.

## Setup

```
$ git clone git@github.com:lvthillo/cheap-vpc.git
$ npm i
$ cdk deploy 
```

## Testing
* Connect with bastion host using AWS Session Manager
* Check route to internet: `traceroute google.com`
* Verify if a `fck-nat` instance is used as hop.
* Check route using VPC ednpoint: `sudo traceroute -n -T -p 443 s3.amazonaws.com`


