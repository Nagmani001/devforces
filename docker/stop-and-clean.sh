# stop services
docker compose -f ./docker/docker-compose.yml down

# clean everything
docker container prune -f
docker volume prune -f
docker network prune -f
