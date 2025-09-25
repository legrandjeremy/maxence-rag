terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.82.0"
    }
  }

  backend "s3" {
    s3_force_path_style = true
    dynamodb_table = "luna-deployments"
  }
}

provider "aws" {
  alias = "infra"
  region = "eu-west-1"
}

provider "aws" {
  alias = "infra_eu_west_3"
  region = "eu-west-3"
}

provider "aws" {
  alias = "infra_us_east_1"
  region = "us-east-1"
}

data "aws_caller_identity" "this" {
  provider = aws.infra
}