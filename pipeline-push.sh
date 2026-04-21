# bash pipeline-push.sh

git add -A
git commit -m "pipeline run"
git push origin dev
git checkout stg
git pull origin dev
git push origin stg
git checkout main
git pull origin stg
git push origin main