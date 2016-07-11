#!/bin/sh
version="$1"
if [ -z "$version" ]; then
    echo "Usage: release.sh version"
    exit
fi

echo $version

jq ".version=\"$version\"" < package.json > _package.json
mv _package.json package.json
name=$(jq -r ".name" < package.json)
archive=release/$name-$version.zip

mkdir release
git archive -o $archive HEAD

git diff
git status
echo "Confirm release with YES"
read confirmation
if [ "$confirmation" != 'YES' ]; then
    echo "Ok, maybe not."
    exit
fi
git add -f package.json
git commit -am "$version"
git tag -a "v$version" -m "release $version"
git push origin "v$version"
grunt rsync
npm publish
hub release create -a $archive "v$version"
#git checkout master
