resource "aws_s3_bucket" "frontend" {
  bucket = "clipshare-frontend-rayyan"

  tags = {
    Project = "clipshare"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.js"
  }

  error_document {
    key = "error.js"
  }
}

//now as per the roadmap i had devised , i'm gonna add a CDN here to help others see this 