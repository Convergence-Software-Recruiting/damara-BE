#!/bin/bash

# Damara BE 배포 스크립트
# EC2 서버에서 실행: bash deploy.sh

set -e

echo "🚀 Damara BE 배포 시작..."

# 1. 프로젝트 디렉토리로 이동
cd ~/damara-BE || { echo "❌ damara-BE 디렉토리를 찾을 수 없습니다."; exit 1; }

# 2. Git에서 최신 코드 가져오기
echo "📥 Git에서 최신 코드 가져오기..."
git pull origin main || echo "⚠️  Git pull 실패 (계속 진행)"

# 3. 의존성 설치
echo "📦 의존성 설치..."
npm install

# 4. 빌드
echo "🔨 프로젝트 빌드..."
npm run build

# 5. .env 파일 생성 (없으면)
if [ ! -f .env ]; then
    echo "📝 .env 파일 생성..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000

DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=ww001009!
DB_NAME=damara
DB_PORT=3306

DB_FORCE_SYNC=false
DISABLE_HELMET=TRUE
API_BASE_URL=http://be.damara.bluerack.org
ENVEOF
    echo "✅ .env 파일 생성 완료"
else
    echo "ℹ️  .env 파일이 이미 존재합니다."
fi

# 6. MySQL 데이터베이스 확인 및 생성
echo "🗄️  MySQL 데이터베이스 확인..."
sudo mysql -u root -pww001009! << MYSQLEOF 2>/dev/null || echo "⚠️  MySQL 접속 확인 필요"
CREATE DATABASE IF NOT EXISTS damara;
MYSQLEOF

# 7. PM2로 서버 재시작
echo "🔄 PM2 서버 재시작..."
pm2 delete damara 2>/dev/null || echo "ℹ️  기존 프로세스 없음"
pm2 start dist/src/server.js --name damara --update-env

# 8. PM2 자동 시작 설정
pm2 save 2>/dev/null || echo "⚠️  PM2 save 실패"

# 9. 상태 확인
echo ""
echo "✅ 배포 완료!"
echo ""
echo "📊 PM2 상태:"
pm2 status
echo ""
echo "📋 서버 로그 (최근 20줄):"
pm2 logs damara --lines 20 --nostream
echo ""
echo "🌐 Swagger 접속: http://be.damara.bluerack.org/api-docs"
echo "📡 API 엔드포인트: http://be.damara.bluerack.org/api"
echo ""
echo "💡 로그 확인: pm2 logs damara"
echo "💡 서버 재시작: pm2 restart damara --update-env"

