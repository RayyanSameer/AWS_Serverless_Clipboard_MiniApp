terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "clipshare-tfstate-rayyan"
    key            = "clipshare/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "clipshare-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}