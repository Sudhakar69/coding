include {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "vpc"
}

inputs = {
  region          = "us-west-2"
  cluster_name    = "dev-cluster"
  cluster_version = "1.21"
  subnets         = dependency.vpc.outputs.public_subnets
  vpc_id          = dependency.vpc.outputs.vpc_id
  key_name        = "Windows"
}