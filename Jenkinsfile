pipeline {
    // Menjalankan di agent mana pun, dengan asumsi Docker sudah terinstall di sana.
    agent any

    environment {
        DOCKER_IMAGE = 'frontend-stock-opname'
        CONTAINER_NAME = 'frontend-stock-opname-container'
        HOST_PORT = '8090'
        CONTAINER_PORT = '80'
    }

    stages {
        stage('Build Docker Image') {
            environment {
                // Mengambil credential dari Jenkins dan memasukkannya ke variabel environment
                VITE_API_URL = credentials('VITE_API_URL_CREDENTIAL')
            }
            steps {
                script {
                    try {
                        // Membuat file .env.production menggunakan perintah shell
                        echo "Membuat file .env.production..."
                        sh "echo VITE_API_URL=${VITE_API_URL} > .env.production"

                        // Membangun image Docker menggunakan perintah shell dan tag BUILD_NUMBER
                        echo "Membangun Docker image: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                        sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    } finally {
                        // Membersihkan file .env.production setelah build selesai
                        echo "Membersihkan file .env.production..."
                        sh "rm -f .env.production"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying container ${CONTAINER_NAME}"

                    // Menghentikan dan menghapus kontainer lama menggunakan perintah shell.
                    echo "Menghentikan dan menghapus container yang sudah ada..."
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"

                    // Menjalankan kontainer baru menggunakan perintah shell dengan restart policy
                    echo "Menjalankan container baru..."
                    sh "docker run -d -p ${HOST_PORT}:${CONTAINER_PORT} --restart always --name ${CONTAINER_NAME} ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline selesai! Aplikasi berjalan di http://localhost:${HOST_PORT}"
        }
        failure {
            echo "Pipeline gagal."
        }
    }
}