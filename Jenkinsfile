def test_server_tag = "simple-test-server"
def prod_server_tag = "simple-prod-server"

def work_agent

if (BRANCH_NAME == "master"){
    work_agent = prod_server_tag
}else{
    work_agent = test_server_tag
}


pipeline{
    agent {
        label work_agent
    }
    stages{
        stage("prepare"){
            steps{
                script{
                    build_tag = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                }
                echo "version : ${build_tag}"
            }
        }
        stage("install"){
            steps{
                sh 'npm ci'
            }
        }
        stage("test"){
            when{
                branch 'dev'
            }
            steps{
                sh 'npm test'
            }
        }
        stage("build"){
            steps{
                sh "npm run build -- --version ${build_tag}"
            }
        }
        stage("deploy"){
            steps{
                sh "npm run deploy -- --version ${build_tag}"
            }
        }
    }
    post{
        success{
            echo "======== pipeline all done ========"
        }
        failure{
            echo "======== pipeline failed ========"
        }
    }
}