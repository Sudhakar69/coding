remote_state {
  backend = "s3"
  config = {
    bucket = "Test-S3"
    key    = "${path_relative_to_include()}/terraform.tfstate"
    region = "us-west-2"
  }
}