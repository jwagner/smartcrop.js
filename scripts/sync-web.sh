#!/bin/bash
for f in examples/*.{html,js,css}; do
  gzip -k $f
done
rsync -vLr examples smartcrop.js doc/example.jpg x.29a.ch:/var/www/static/sandbox/2014/smartcrop/
rm examples/*.gz
