include {
  path = find_in_parent_folders()
}

inputs = {
  region             = "us-west-2"
  cidr_block         = "10.0.0.0/16"
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  name               = "dev-vpc"
}