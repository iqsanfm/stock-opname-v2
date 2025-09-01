pipeline {
    // Menjalankan pipeline di dalam sebuah kontainer yang memiliki Docker CLI
    // dan bisa berkomunikasi dengan Docker daemon di mesin host.
    agent {
        docker {
            image 'docker:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKER_IMAGE = 'stock-opname-react-v2'
        CONTAINER_NAME = 'stock-opname-app'
        HOST_PORT = '8090'
        CONTAINER_PORT = '80'
    }

    stages {
        stage('Build Docker Image') {
            environment {
                // Jenkins akan mengambil credential dengan ID 'VITE_API_URL_CREDENTIAL'
                // dan memasukkan nilainya ke dalam variabel VITE_API_URL.
                VITE_API_URL = credentials('VITE_API_URL_CREDENTIAL')
            }
            steps {
                script {
                    try {
                        // Membuat file .env.production secara dinamis untuk proses build
                        echo "Membuat file .env.production..."
                        sh "echo VITE_API_URL=${VITE_API_URL} > .env.production"

                        // Dockerfile akan menyalin file .env.production ini.
                        // Vite akan menggunakannya selama 'npm run build'.
                        echo "Membangun Docker image: ${DOCKER_IMAGE}"
                        docker.build(DOCKER_IMAGE, '.')
                    } finally {
                        // Membersihkan file .env.production dari workspace setelah build
                        echo "Membersihkan file .env.production..."
                        sh "rm -f .env.production"
                    }
                }
            }
        }

        stage('Deploy Docker Container') {
            steps {
                script {
                    echo "Deploying container ${CONTAINER_NAME}"
                    def container = docker.container(CONTAINER_NAME)
                    if (container.exists()) {
                        echo "Menghentikan dan menghapus container yang sudah ada..."
                        container.stop()
                        container.remove()
                    }

                    echo "Menjalankan container baru..."
                    // Variabel lingkungan sudah 'terpanggang' di dalam aplikasi React saat build,
                    // jadi kita tidak perlu meneruskannya lagi ke 'docker run'.
                    docker.run("-d -p ${HOST_PORT}:${CONTAINER_PORT} --name ${CONTAINER_NAME}", DOCKER_IMAGE)
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
