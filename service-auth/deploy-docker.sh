VERSION=0.0.1
DOCKER_TAG=trongnv138/k8s_facebook:service-auth-$VERSION
docker build -t $DOCKER_TAG -f Dockerfile .
docker push $DOCKER_TAG