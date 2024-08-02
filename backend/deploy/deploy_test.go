package deploy

import "testing"

func AwsDeploy(t *testing.T) {
	deployer := &AwsDeployer{}
	deployer.Deploy("", &Aws{})
}

func TestCosDeploy(t *testing.T) {
	deployer := &CosDeployer{}
	err := deployer.Deploy("", &Cos{
		SecretId:  "",
		SecretKey: "",
		Region:    "",
		Bucket:    "",
	})
	println(err)
}

func TestOssDeploy(t *testing.T) {
	deployer := &OssDeployer{}
	err := deployer.Deploy("", &Oss{
		AccessKeyID:     "",
		AccessKeySecret: "",
		Region:          "",
		Bucket:          "",
	})
	println(err)
}
