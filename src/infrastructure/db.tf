#DynamoDB Table for storing the encyrpted chats 

resource "aws_dynamodb_table" "session_table" {
  name         = "clipshare-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_code"

  attribute {
    name = "session_code"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project = "clipshare"
  }
}
