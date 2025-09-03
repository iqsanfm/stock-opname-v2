pipeline {
    // Menjalankan di agent mana pun, dengan asumsi Docker sudah terinstall di sana.
    agent any

    environment {
        DOCKER_IMAGE = 'stock-opname-react-v2'
        CONTAINER_NAME = 'stock-opname-app'
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

                        // Membangun image Docker menggunakan perintah shell
                        echo "Membangun Docker image: ${DOCKER_IMAGE}"
                        sh "docker build -t ${DOCKER_IMAGE} ."
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
                    // Hentikan kontainer lama jika ada (|| true agar tidak error jika kontainer tidak ada)
                    sh 'docker stop backend-vercel-container || true'
                    // Hapus kontainer lama jika ada
                    sh 'docker rm backend-vercel-container || true'
                    // Jalankan kontainer baru dengan restart policy
                    sh 'docker run -d -p 5050:5050 --restart always --name backend-vercel-container backend-vercel:${BUILD_NUMBER}'
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