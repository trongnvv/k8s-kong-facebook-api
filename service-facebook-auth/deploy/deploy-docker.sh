VERSION=0.0.2
DOCKER_TAG=trongnv138/k8s_facebook:service-facebook-auth-$VERSION
cd ..
docker build -t $DOCKER_TAG -f deploy/Dockerfile .
docker push $DOCKER_TAG
kubectl create configmap cm-facebook-auth --from-env-file=local.env
kubectl apply -f deploy/k8s-exec.yaml