#!/bin/bash -x

# This assembles all the file together for packaging up the chrome extension

# Copy over the img asset
cp ./img/* ./dist/resource

# Copy over the content css
cp ./css/content_script.css ./dist/resource

# Copy over the iframe.html
cat ./iframe.html | sed -e 's/build/resource/' > ./dist/iframe.html
cat ./firstinstall.html | sed -e 's/build/resource/g;s/img\//resource\//g' > ./dist/firstinstall.html

# Copy over the vendodr
cp -r ./vendor ./dist/

# Finally build webpack
GITSHA1=`git rev-parse HEAD`
GITSHA1=$GITSHA1 NODE_ENV=production webpack --colors -p --config ./webpack/webpack.config.prod.js

# Zip everything up
ZIP_NAME="cueb_`echo $GITSHA1 | tail -c 5`.zip"
cd dist/ && zip -r -o $ZIP_NAME . && mv $ZIP_NAME ../zips && cd ../
