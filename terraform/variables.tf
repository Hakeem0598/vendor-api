variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "image_tag" {
  type = string
}

variable "app_name" {
  type    = string
  default = "vendor-api"
}

variable "websocket_table_name" {
  type    = string
  default = "websocket-connections"
}

variable "api_gateway_stage_name" {
  type    = string
  default = "primary"
}

variable "vendor_table_name" {
  type    = string
  default = "test_vendors"
}