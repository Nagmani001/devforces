# build before up , since compse by default will not build / cache build
docker compose -f ./docker/docker-compose.yml build

docker compose -f ./docker/docker-compose.yml up -d --wait

# migrate database
cd /home/nagmani/root/projects/devforces/packages/db && prisma migrate dev

# seed database
cd /home/nagmani/root/projects/devforces/packages/db && prisma db seed
