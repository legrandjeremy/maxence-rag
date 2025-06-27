terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.82.0"
    }
  }

  backend "s3" {
    s3_force_path_style = true
    dynamodb_table = "x-github-deployments"
  }
}

provider "aws" {
  alias = "infra"
  region = "eu-west-1"
}

provider "aws" {
  alias = "infra_eu_central_2"
  region = "eu-central-2"
}

provider "aws" {
  alias = "infra_us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias = "infra_orga_uci"
  region = "us-east-1"
  assume_role {
    role_arn = var.UCI_GLOBAL_AWS_DEPLOYMENT_ROLE_ARN_ROUTE53
  }
}

data "aws_caller_identity" "this" {
  provider = aws.infra
}