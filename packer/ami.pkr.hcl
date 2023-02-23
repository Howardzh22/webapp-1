variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0dfcb1ef8550277af" 
}

variable "ssh_username" {
  type    = string
  default = "ec2-user"
}


# https://www.packer.io/plugins/builders/amazon/ebs
source "amazon-ebs" "my-ami" {
  region     = "${var.aws_region}"
  
  source_ami = "${var.source_ami}"
  ssh_username = "${var.ssh_username}"
  instance_type = "t2.micro"
  ami_name        = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "AMI for CSYE 6225"
  ami_regions = [
    "us-east-1",
  ]
  profile ="dev"

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }


  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file"{
    source = "../../webapp.zip"
    destination = "/home/ec2-user/webapp.zip"
  }

  provisioner "file"{
    source = "./webapp.service"
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    script = "./webapp.sh"
  }


}