module "secure_file_share" {
  source     = "../modules/secure-file-share"
  aws_region = var.aws_region
  base_name  = var.base_name
  project    = "secure-file-share_Project-${var.project}"
}