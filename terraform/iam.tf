data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amamzonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_main" {
  name               = "${var.app_name}-lamba"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_exec_role" {
  role       = aws_iam_role.lambda_main.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lamba_ws" {
  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:Scan",
      "dynamodb:DescribeTable",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "execute-api:ManageConnections"
    ]
    effect = "Allow"
    resources = [
      "arn:aws:sqs:${var.aws_region}:${local.account_id}:${sqs_queue_name}",
      "arn:aws:dynamodb:${var.aws_region}:${local.account_id}:table/${var.vendor_table_name}",
      "arn:aws:dynamodb:${var.aws_region}:${local.account_id}:table/${var.websocket_table_name}",
    #   "arn:aws:execute-api:${var.aws_region}:${local.account_id}:{ApiId}/${var.api_gateway_stage_name}/{Method}/{ApiSpecificResourcePath}"
    ]
  }
}

resource "aws_iam_policy" "iam_policy" {
  name   = "${var.app_name}-lambda-ws"
  policy = data.aws_iam_policy_document.lamba_ws.json
}

resource "aws_iam_role_policy_attachment" "attach_lambda_role" {
  role       = aws_iam_role.lambda_main.name
  policy_arn = aws_iam_policy.iam_policy.arn
}
