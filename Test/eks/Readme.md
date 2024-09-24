1. Write Terraform Configuration
First, create a directory for your Terraform configuration files. Inside this directory, create a file named main.tf for your main configuration.

main.tf
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

2. Working ‘terraform plan’ for EKS Cluster
Run the following commands to initialize Terraform and preview the resources that will be created:

terraform init
terraform plan

3. Configure kubectl
Create a kubeconfig file to access the EKS cluster. You can leave parts of the config blank as mentioned.

kubeconfig
apiVersion: v1
clusters:
- cluster:
    server: <EKS_CLUSTER_ENDPOINT>
    certificate-authority-data: <BASE64_ENCODED_CA_CERT>
  name: eks-cluster
contexts:
- context:
    cluster: eks-cluster
    user: eks-user
  name: eks-context
current-context: eks-context
kind: Config
preferences: {}
users:
- name: eks-user
  user:
    token: <EKS_CLUSTER_AUTH_TOKEN>

4. Deploy a Simple Workload
Create a Kubernetes manifest file to deploy an Nginx web app.

nginx-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: nginx

Explanation
VPC Module: Creates a VPC with public and private subnets.
EKS Module: Uses the official Terraform AWS EKS module to create the EKS cluster and worker nodes.
kubeconfig: Configures kubectl to access the EKS cluster.
Nginx Deployment: Deploys an Nginx web server with a LoadBalancer service to expose it.
Feel free to ask if you have any questions or need further assistance!

