pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'stock-opname-react-v2' // Changed image name for clarity
        CONTAINER_NAME = 'stock-opname-app'
        HOST_PORT = '5000' // You can access the app at http://localhost:8080
        CONTAINER_PORT = '80' // Nginx container port
    }

    stages {
        // Jenkins is expected to have checked out the code already.
        // If you need to checkout from Git, add a stage like this:
        // stage('Checkout') {
        //     steps {
        //         git branch: 'main', url: 'https://github.com/your-repo/stock-opname-react-v2.git'
        //     }
        // }

        stage('Build Docker Image') {
            steps {
                script {
                    // The Dockerfile handles installing dependencies and building the React app.
                    echo "Building Docker image: ${DOCKER_IMAGE}"
                    docker.build(DOCKER_IMAGE, '.')
                }
            }
        }

        stage('Deploy Docker Container') {
            steps {
                script {
                    echo "Deploying container ${CONTAINER_NAME}"
                    // Stop and remove the existing container if it is running
                    def container = docker.container(CONTAINER_NAME)
                    if (container.exists()) {
                        echo "Stopping and removing existing container..."
                        container.stop()
                        container.remove()
                    }

                    // Run the new container
                    echo "Starting new container..."
                    docker.run("-d -p ${HOST_PORT}:${CONTAINER_PORT} --name ${CONTAINER_NAME}", DOCKER_IMAGE)
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline finished successfully! Application is running at http://localhost:${HOST_PORT}"
        }
        failure {
            echo "Pipeline failed."
        }
    }
}