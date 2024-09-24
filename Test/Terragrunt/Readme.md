Directory Structure
First, let’s set up the directory structure for Terragrunt:

├── terragrunt.hcl
├── vpc
│   └── terragrunt.hcl
│   └── main.tf
├── eks
    └── terragrunt.hcl
    └── main.tf

Root terragrunt.hcl
Create a terragrunt.hcl file at the root of your project:

terraform {
  source = "./vpc"
}

include {
  path = find_in_parent_folders()
}

VPC Module
In the vpc directory, create a main.tf file:

vpc/main.tf
provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.14.2"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-west-2a", "us-west-2b", "us-west-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

And a terragrunt.hcl file:

vpc/terragrunt.hcl
terraform {
  source = "."
}

EKS Module
In the eks directory, create a main.tf file:

eks/main.tf
provider "aws" {
  region = "us-west-2"
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "my-cluster"
  cluster_version = "1.21"
  subnets         = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id

  node_groups = {
    eks_nodes = {
      desired_capacity = 2
      max_capacity     = 3
      min_capacity     = 1

      instance_type = "t3.medium"
    }
  }
}

And a terragrunt.hcl file:

eks/terragrunt.hcl
terraform {
  source = "."
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs = {
    vpc_id = "vpc-12345678"
    private_subnets = ["subnet-12345678", "subnet-87654321"]
  }
}

Explanation
Root terragrunt.hcl: Specifies the source directory for the VPC module.
VPC Module: Contains the Terraform configuration for the VPC.
EKS Module: Contains the Terraform configuration for the EKS cluster and references the VPC module using Terragrunt’s dependency block.
Running Terragrunt
To initialize and apply the configuration, navigate to the root directory and run:

terragrunt run-all init
terragrunt run-all plan

This setup uses Terragrunt to manage the dependencies between the VPC and EKS modules, ensuring that the VPC is created before the EKS cluster.