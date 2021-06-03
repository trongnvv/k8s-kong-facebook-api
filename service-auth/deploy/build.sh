VERSION=0.0.1
DOCKER_TAG=trongnv138/k8s_facebook:service-auth-$VERSION
cd ..
docker build -t $DOCKER_TAG -f deploy/Dockerfile .
docker push $DOCKER_TAG
#kubectl create configmap cm-auth --from-env-file=local.env