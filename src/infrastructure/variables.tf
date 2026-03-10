#This file contains vars whose values can be changed as needed

variable "aws_region" {
  default = "ap-south-1"
}

variable "table_name" {
  default = "clipshare"
}

variable "ttl_seconds" {
  default = 1800
}

# ttl is the time to live , how long should your message live on the db. it's set to 30mins