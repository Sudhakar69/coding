variable "region" {}
variable "cidr_block" {}
variable "public_subnet_cidrs" {
  type = list(string)
}
variable "name" {}
variable "access_key" {}
variable "secret_key" {}